import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
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
    <div className="space-y-10">
      <PageHeader
        eyebrow="Học viên"
        title="Tổng quan học tập"
        description="Tiến độ khóa học và kết quả kiểm tra (lưu cục bộ trên trình duyệt)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard accent="student" label="Tiến độ TB" value={`${stats.avgProgress}%`} />
        <StatCard accent="student" label="Bài kiểm tra đã làm" value={String(stats.testCount)} />
        <StatCard
          accent="student"
          label="Điểm TB (ước)"
          value={stats.avgDisplay}
          hint={`Lần gần nhất: ${stats.lastScore}`}
        />
      </div>

      <Panel title="Việc cần làm" subtitle="Gợi ý bước tiếp theo.">
        <ul className="space-y-0 text-sm">
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3 first:pt-0">
            <span className="text-slate-300">Xem bài giảng tiếp theo</span>
            <Link
              to="/hoc-vien/bai-giang"
              className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25"
            >
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 border-b border-white/5 py-3">
            <span className="text-slate-300">Làm thêm bài kiểm tra</span>
            <Link
              to="/bai-kiem-tra"
              className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25"
            >
              Mở →
            </Link>
          </li>
          <li className="flex items-center justify-between gap-2 py-3 last:pb-0">
            <span className="text-slate-300">Cập nhật hồ sơ</span>
            <Link
              to="/hoc-vien/ho-so"
              className="rounded-lg bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/25"
            >
              Mở →
            </Link>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
