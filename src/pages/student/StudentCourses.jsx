import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { btnPrimaryStudent } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { usePublicContent } from '../../hooks/usePublicContent'
import { PUBLIC_ACTION_ERROR } from '../../lib/publicUserMessages.js'
import { toast } from 'sonner'
import { getMyCourseProgress, patchMyCourseProgress } from '../../services/meApi.js'

export default function StudentCourses() {
  const { user, session } = useAuthSession()
  const [searchParams] = useSearchParams()
  const courseFocusParam = searchParams.get('course') || ''
  const { courses: pubCourses, subjects, loading: pubLoading } = usePublicContent()
  const [rows, setRows] = useState([])
  const [version, setVersion] = useState(0)
  const [draftPct, setDraftPct] = useState({})
  const [highlightCourseId, setHighlightCourseId] = useState(null)

  const subjectIdToSlug = useMemo(() => {
    const m = new Map()
    for (const s of subjects || []) {
      if (s?.id != null && s?.slug) m.set(Number(s.id), String(s.slug))
    }
    return m
  }, [subjects])

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
      if (import.meta.env.DEV) console.error('[StudentCourses]', e)
      toast.error(PUBLIC_ACTION_ERROR)
      return
    }
    setVersion((v) => v + 1)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Khóa học của tôi"
        description="Theo dõi tiến độ từng khóa. Nhập phần trăm hoàn thành (0–100) và bấm Lưu."
      />

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
                to={
                  c.subject_id != null && subjectIdToSlug.has(Number(c.subject_id))
                    ? `/bai-giang?subject=${encodeURIComponent(subjectIdToSlug.get(Number(c.subject_id)))}`
                    : '/bai-giang'
                }
                className={`${btnPrimaryStudent} inline-block text-xs`}
              >
                Xem bài giảng
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
