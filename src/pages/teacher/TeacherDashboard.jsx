import { useMemo } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useTeacherState } from '../../hooks/useTeacherState'
import { computeTeacherDashboardStats } from '../../utils/teacherStorage'

export default function TeacherDashboard() {
  const { state } = useTeacherState()
  const stats = useMemo(() => computeTeacherDashboardStats(state), [state])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Giáo viên"
        title="Tổng quan lớp học"
        description="Tóm tắt công việc và lịch sắp tới — dữ liệu lưu cục bộ trên trình duyệt."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard accent="teacher" label="Lớp đang dạy" value={String(stats.myClasses)} />
        <StatCard
          accent="teacher"
          label="Học sinh (ước)"
          value={String(stats.totalStudents)}
          hint="Từ sĩ số các lớp"
        />
        <StatCard accent="teacher" label="Chờ chấm" value={String(stats.pendingGrading)} />
        <StatCard accent="teacher" label="Buổi trong lịch" value={String(stats.upcomingSessions)} />
      </div>

      <Panel title="Lịch dạy gần nhất" subtitle="Các buổi sắp tới trong lịch của bạn.">
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
