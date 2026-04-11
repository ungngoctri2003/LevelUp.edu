import { useEffect } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useTeacherState } from '../../hooks/useTeacherState'
import PageLoading from '../../components/ui/PageLoading.jsx'

export default function TeacherDashboard() {
  const { state, loading, error, computeTeacherDashboardStats } = useTeacherState()
  const stats = computeTeacherDashboardStats()

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Giáo viên"
        title="Tổng quan lớp học"
        description="Tóm tắt lớp học, học sinh, lịch dạy và bài cần chấm."
      >
        <Link
          to="/giao-vien/ho-so"
          className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-500/25 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
        >
          Hồ sơ
        </Link>
      </PageHeader>

      {loading && <PageLoading variant="inline" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard accent="teacher" label="Lớp đang dạy" value={String(stats.myClasses)} />
        <StatCard
          accent="teacher"
          label="Học sinh"
          value={String(stats.totalStudents)}
          hint="Ước tính theo danh sách lớp"
        />
        <StatCard accent="teacher" label="Chờ chấm" value={String(stats.pendingGrading)} />
        <StatCard accent="teacher" label="Buổi trong lịch" value={String(stats.upcomingSessions)} />
      </div>

      <Panel title="Lịch dạy gần nhất" subtitle="Theo thứ & khung giờ đã lưu">
        <ul className="space-y-0">
          {state.schedule.slice(0, 4).map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 py-3 text-sm first:pt-0 last:border-0 last:pb-0 dark:border-white/5"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {s.day} · {s.time}
                </span>
                <p className="text-xs text-slate-500">{s.locationLabel}</p>
              </div>
              <span className="rounded-full border border-gray-200 bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                {s.className}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
