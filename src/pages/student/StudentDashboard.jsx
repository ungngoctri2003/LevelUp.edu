import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuthSession } from '../../context/AuthSessionContext'
import { studentEnrolledCourses } from '../../data/studentBusinessData'
import { getCourseProgressMap, getTestResults } from '../../utils/userBusinessStorage'

export default function StudentDashboard() {
  const { user } = useAuthSession()
  const email = user?.email || ''

  const stats = useMemo(() => {
    const tests = getTestResults(email)
    const last = tests[0]
    const avg =
      tests.length > 0
        ? tests.reduce((s, t) => s + (t.score / t.maxScore) * 10, 0) / tests.length
        : null
    const courseMap = getCourseProgressMap(email)
    const avgProgress =
      studentEnrolledCourses.reduce((s, c) => {
        const stored = courseMap[c.key]?.progress
        const p = typeof stored === 'number' ? stored : c.defaultProgress
        return s + p
      }, 0) / Math.max(studentEnrolledCourses.length, 1)

    return {
      testCount: tests.length,
      lastScore: last ? `${last.score}/${last.maxScore}` : '—',
      avgDisplay: avg != null ? avg.toFixed(1) : '—',
      avgProgress: Math.round(avgProgress),
    }
  }, [email])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Tổng quan</h2>
        <p className="mt-1 text-sm text-slate-400">Tiến độ khóa học và kết quả kiểm tra (lưu trên trình duyệt).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Tiến độ TB</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{stats.avgProgress}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Bài kiểm tra đã làm</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.testCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Điểm TB (ước)</p>
          <p className="mt-2 text-3xl font-bold text-fuchsia-300">{stats.avgDisplay}</p>
          <p className="mt-1 text-xs text-slate-500">Lần gần nhất: {stats.lastScore}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="font-semibold text-white">Việc cần làm</h3>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
            <span className="text-slate-300">Xem bài giảng tiếp theo</span>
            <Link to="/hoc-vien/bai-giang" className="text-sky-400 hover:text-sky-300">
              Đi →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
            <span className="text-slate-300">Làm thêm bài kiểm tra</span>
            <Link to="/bai-kiem-tra" className="text-sky-400 hover:text-sky-300">
              Đi →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-slate-300">Cập nhật hồ sơ</span>
            <Link to="/hoc-vien/ho-so" className="text-sky-400 hover:text-sky-300">
              Đi →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
