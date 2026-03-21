import { useMemo } from 'react'
import StatCard from '../../components/dashboard/StatCard'
import { useTeacherState } from '../../hooks/useTeacherState'
import { computeTeacherDashboardStats } from '../../utils/teacherStorage'

export default function TeacherDashboard() {
  const { state } = useTeacherState()
  const stats = useMemo(() => computeTeacherDashboardStats(state), [state])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Xin chào</h2>
        <p className="mt-1 text-sm text-slate-400">Tóm tắt công việc và lịch sắp tới — dữ liệu lưu trên trình duyệt.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lớp đang dạy" value={String(stats.myClasses)} />
        <StatCard label="Học sinh (ước)" value={String(stats.totalStudents)} hint="Từ sĩ số các lớp" />
        <StatCard label="Chờ chấm" value={String(stats.pendingGrading)} />
        <StatCard label="Buổi trong lịch" value={String(stats.upcomingSessions)} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">Lịch dạy gần nhất</h3>
        <ul className="mt-4 space-y-3">
          {state.schedule.slice(0, 4).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0">
              <span className="text-slate-200">
                {s.day} · {s.time}
              </span>
              <span className="text-slate-400">{s.className}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
