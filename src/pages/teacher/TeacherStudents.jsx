import { mockTeacherStudents } from '../../data/dashboardData'

export default function TeacherStudents() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Học sinh</h2>
        <p className="text-sm text-slate-400">Theo dõi tiến độ các lớp bạn phụ trách.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Tiến độ</th>
              <th className="px-4 py-3">Hoạt động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {mockTeacherStudents.map((s) => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-emerald-300">{s.id}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-slate-400">{s.className}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-emerald-500/80" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{s.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">{s.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
