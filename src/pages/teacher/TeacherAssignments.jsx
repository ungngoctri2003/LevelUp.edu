import { mockTeacherAssignments } from '../../data/dashboardData'

export default function TeacherAssignments() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bài tập & kiểm tra</h2>
          <p className="text-sm text-slate-400">Tình hình nộp bài theo từng lớp.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Giao bài mới (mock)
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Tên bài</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Hạn nộp</th>
              <th className="px-4 py-3">Đã nộp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {mockTeacherAssignments.map((a) => (
              <tr key={a.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 text-slate-400">{a.className}</td>
                <td className="px-4 py-3">{a.due}</td>
                <td className="px-4 py-3">
                  {a.submitted}/{a.total}{' '}
                  <span className="text-slate-500">
                    ({Math.round((a.submitted / a.total) * 100)}%)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
