import { mockTeacherSchedule } from '../../data/dashboardData'

export default function TeacherSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Lịch dạy</h2>
        <p className="text-sm text-slate-400">Theo tuần — liên kết phòng học online (mô phỏng).</p>
      </div>

      <div className="space-y-3">
        {mockTeacherSchedule.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-white">
                {s.day} · <span className="text-emerald-300">{s.time}</span>
              </p>
              <p className="text-sm text-slate-400">{s.className}</p>
            </div>
            <p className="text-sm text-slate-500">{s.room}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
