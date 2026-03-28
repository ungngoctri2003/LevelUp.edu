import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useTeacherState } from '../../hooks/useTeacherState'

export default function TeacherDashboard() {
  const { state, loading, error, computeTeacherDashboardStats } = useTeacherState()
  const stats = computeTeacherDashboardStats()

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Giáo viên"
        title="Tổng quan lớp học"
        description="Dữ liệu từ Supabase (classes, enrollments, lịch, bài nộp)."
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard accent="teacher" label="Lớp đang dạy" value={String(stats.myClasses)} />
        <StatCard
          accent="teacher"
          label="Học sinh (ước)"
          value={String(stats.totalStudents)}
          hint="Từ class_enrollments"
        />
        <StatCard accent="teacher" label="Chờ chấm" value={String(stats.pendingGrading)} />
        <StatCard accent="teacher" label="Buổi trong lịch" value={String(stats.upcomingSessions)} />
      </div>

      <Panel title="Lịch dạy gần nhất" subtitle="schedule_slots">
        <ul className="space-y-0">
          {state.schedule.slice(0, 4).map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3 text-sm first:pt-0 last:border-0 last:pb-0"
            >
              <span className="font-medium text-slate-200">
                {s.day} · {s.time}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
                {s.className}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
