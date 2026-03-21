import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSession } from '../../context/AuthSessionContext'
import { studentEnrolledCourses } from '../../data/studentBusinessData'
import { getCourseProgressMap, setCourseProgress } from '../../utils/userBusinessStorage'

export default function StudentCourses() {
  const { user } = useAuthSession()
  const email = user?.email || ''
  const [version, setVersion] = useState(0)

  const rows = useMemo(() => {
    const map = getCourseProgressMap(email)
    return studentEnrolledCourses.map((c) => {
      const stored = map[c.key]
      const progress = typeof stored?.progress === 'number' ? stored.progress : c.defaultProgress
      return { ...c, progress }
    })
  }, [email, version])

  const bump = (key, delta) => {
    const map = getCourseProgressMap(email)
    const c = studentEnrolledCourses.find((x) => x.key === key)
    const base = typeof map[key]?.progress === 'number' ? map[key].progress : c?.defaultProgress ?? 0
    const next = Math.min(100, Math.max(0, base + delta))
    setCourseProgress(email, key, { progress: next })
    setVersion((v) => v + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Khóa học của tôi</h2>
        <p className="text-sm text-slate-400">Tiến độ được lưu cục bộ — demo trước khi có máy chủ.</p>
      </div>

      <div className="grid gap-4">
        {rows.map((c) => (
          <div key={c.key} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-white">{c.title}</h3>
                <p className="mt-1 text-sm text-slate-400">Giảng viên: {c.teacher}</p>
              </div>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-200">{c.progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${c.progress}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              <span className="text-slate-500">Tiếp theo:</span> {c.nextLesson}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => bump(c.key, 5)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                +5% tiến độ (demo)
              </button>
              <Link
                to="/bai-giang"
                className="rounded-lg bg-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-500/40"
              >
                Xem bài giảng
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
