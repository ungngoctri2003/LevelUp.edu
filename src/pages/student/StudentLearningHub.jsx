import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { btnPrimaryStudent } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { usePublicContent } from '../../hooks/usePublicContent'
import { PUBLIC_ACTION_ERROR } from '../../lib/publicUserMessages.js'
import { buildLessonsByCourse } from '../../services/publicApi.js'
import { getMyCourseProgress, patchMyCourseProgress } from '../../services/meApi.js'
import { toast } from 'sonner'

const SECTION_LESSONS_ID = 'student-section-bai-giang'

export default function StudentLearningHub() {
  const location = useLocation()
  const { user, session } = useAuthSession()
  const [searchParams] = useSearchParams()
  const courseFocusParam = searchParams.get('course') || ''
  const { courses: pubCourses, subjects, lessons, loading: pubLoading } = usePublicContent()

  const [rows, setRows] = useState([])
  const [version, setVersion] = useState(0)
  const [draftPct, setDraftPct] = useState({})
  const [highlightCourseId, setHighlightCourseId] = useState(null)

  const lessonsByCourse = useMemo(
    () => buildLessonsByCourse(pubCourses, lessons, subjects),
    [pubCourses, lessons, subjects],
  )
  const firstCourseBlock = lessonsByCourse[0]
  const sampleLessons = firstCourseBlock?.lessons?.slice(0, 4) || []

  const load = useCallback(async () => {
    const token = session?.access_token
    if (!token || !user?.id) {
      const guestRows = (pubCourses || []).map((c) => ({
        id: c.id,
        subject_id: c.subject_id,
        title: c.title,
        teacher: '—',
        progress: 0,
        nextLesson: 'Xem bài giảng công khai',
      }))
      setRows(guestRows)
      setDraftPct(Object.fromEntries(guestRows.map((r) => [r.id, '0'])))
      return
    }
    let prog = []
    try {
      const { data } = await getMyCourseProgress(token)
      prog = data || []
    } catch {
      prog = []
    }
    const pmap = Object.fromEntries((prog || []).map((p) => [p.course_id, p]))
    const nextRows = (pubCourses || []).map((c) => {
      const p = pmap[c.id]
      return {
        id: c.id,
        subject_id: c.subject_id,
        title: c.title,
        teacher: '—',
        progress: p ? Number(p.progress_pct) : 0,
        nextLesson: 'Cập nhật tiến độ hoặc xem bài giảng',
      }
    })
    setRows(nextRows)
    setDraftPct(Object.fromEntries(nextRows.map((r) => [r.id, String(Math.round(r.progress))])))
  }, [user?.id, pubCourses, session?.access_token])

  useEffect(() => {
    load()
  }, [load, version])

  useEffect(() => {
    if (!courseFocusParam || pubLoading) return
    const idNum = Number(courseFocusParam)
    if (!Number.isFinite(idNum)) return
    const found = rows.some((r) => Number(r.id) === idNum)
    if (!found) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`student-course-${idNum}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setHighlightCourseId(idNum)
        window.setTimeout(() => setHighlightCourseId(null), 2600)
      }
    }, 80)
    return () => window.clearTimeout(t)
  }, [courseFocusParam, pubLoading, rows])

  useEffect(() => {
    if (location.hash !== `#${SECTION_LESSONS_ID}`) return
    const t = window.setTimeout(() => {
      document.getElementById(SECTION_LESSONS_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(t)
  }, [location.hash, pubLoading])

  const saveProgress = async (courseId) => {
    const token = session?.access_token
    if (!token || !user?.id) return
    const raw = draftPct[courseId]
    const n = Math.min(100, Math.max(0, Number(raw)))
    if (Number.isNaN(n)) {
      toast.warning('Nhập số từ 0 đến 100')
      return
    }
    try {
      await patchMyCourseProgress(token, courseId, { progress_pct: n })
      toast.success('Đã cập nhật tiến độ.')
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentLearningHub]', e)
      toast.error(PUBLIC_ACTION_ERROR)
      return
    }
    setVersion((v) => v + 1)
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Học tập"
        description="Theo dõi khóa học và tiến độ; phía dưới là vài bài giảng trong khóa đầu danh sách và liên kết mở thư viện đầy đủ."
      />

      <section id="student-section-khoa-hoc" className="space-y-4 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Khóa học</h2>
        {pubLoading && <p className="text-sm text-slate-400">Đang tải…</p>}
        <div className="grid gap-4">
          {rows.map((c) => (
            <Panel
              key={c.id}
              id={`student-course-${c.id}`}
              noDivider
              className={`transition hover:border-sky-500/20 ${highlightCourseId === Number(c.id) ? 'ring-2 ring-inset ring-sky-400/45' : ''}`}
              padding
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">Giảng viên: {c.teacher}</p>
                </div>
                <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-200">
                  {c.progress}%
                </span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                  style={{ width: `${c.progress}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-slate-300">
                <span className="text-slate-500">Tiếp theo:</span> {c.nextLesson}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Tiến độ %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draftPct[c.id] ?? ''}
                    onChange={(e) => setDraftPct((p) => ({ ...p, [c.id]: e.target.value }))}
                    className="w-20 rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-white"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => saveProgress(c.id)}
                  className="rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-xs font-medium text-sky-200 transition hover:bg-sky-500/25"
                >
                  Lưu tiến độ
                </button>
                <Link
                  to={`/bai-giang?course=${encodeURIComponent(String(c.id))}`}
                  className={`${btnPrimaryStudent} inline-block text-xs`}
                >
                  Xem bài giảng
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <div className="border-t border-white/10 pt-10" />

      <section id={SECTION_LESSONS_ID} className="space-y-4 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Bài giảng</h2>
        <Panel
          title={`Gợi ý — ${firstCourseBlock?.courseTitle || 'Bài giảng'}`}
          subtitle="Một số bài trong khóa đầu danh sách; mở thư viện để chọn khóa và xem toàn bộ bài giảng."
        >
          {pubLoading && <p className="text-sm text-slate-400">Đang tải…</p>}
          <ul className="space-y-2">
            {sampleLessons.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm transition hover:border-sky-500/25 hover:bg-white/5"
              >
                <span className="min-w-0 font-medium text-slate-200">{l.title}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">{l.duration}</span>
                  <Link
                    to={`/bai-giang/${l.id}`}
                    className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/30"
                  >
                    Xem
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to={
              firstCourseBlock?.courseId != null
                ? `/bai-giang?course=${encodeURIComponent(String(firstCourseBlock.courseId))}`
                : '/bai-giang'
            }
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:opacity-95"
          >
            Mở thư viện bài giảng đầy đủ
          </Link>
        </Panel>
      </section>
    </div>
  )
}
