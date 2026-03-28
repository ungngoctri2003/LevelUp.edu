import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { btnPrimaryStudent } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { usePublicContent } from '../../hooks/usePublicContent'
import { getMyCourseProgress, patchMyCourseProgress } from '../../services/meApi.js'

export default function StudentCourses() {
  const { user, session } = useAuthSession()
  const { courses: pubCourses, loading: pubLoading } = usePublicContent()
  const [rows, setRows] = useState([])
  const [version, setVersion] = useState(0)

  const load = useCallback(async () => {
    const token = session?.access_token
    if (!token || !user?.id) {
      setRows(
        (pubCourses || []).map((c) => ({
          id: c.id,
          title: c.title,
          teacher: '—',
          progress: 0,
          nextLesson: 'Xem bài giảng công khai',
        })),
      )
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
    setRows(
      (pubCourses || []).map((c) => {
        const p = pmap[c.id]
        return {
          id: c.id,
          title: c.title,
          teacher: '—',
          progress: p ? Number(p.progress_pct) : 0,
          nextLesson: 'Cập nhật tiến độ hoặc xem bài giảng',
        }
      }),
    )
  }, [user?.id, pubCourses, session?.access_token])

  useEffect(() => {
    load()
  }, [load, version])

  const bump = async (courseId, delta) => {
    const token = session?.access_token
    if (!token || !user?.id) return
    const row = rows.find((r) => r.id === courseId)
    const base = row?.progress ?? 0
    const next = Math.min(100, Math.max(0, base + delta))
    try {
      await patchMyCourseProgress(token, courseId, { progress_pct: next })
    } catch (e) {
      alert(e.message || 'Không cập nhật được tiến độ')
      return
    }
    setVersion((v) => v + 1)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Khóa học của tôi" description="Khóa hiển thị công khai + tiến độ trong student_course_progress." />

      {pubLoading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="grid gap-4">
        {rows.map((c) => (
          <Panel key={c.id} noDivider className="transition hover:border-sky-500/20" padding>
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
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => bump(c.id, 5)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
              >
                +5% tiến độ
              </button>
              <Link to="/bai-giang" className={`${btnPrimaryStudent} inline-block text-xs`}>
                Xem bài giảng
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
