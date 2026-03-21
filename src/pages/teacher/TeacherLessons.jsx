import { mockTeacherLessons } from '../../data/dashboardData'

export default function TeacherLessons() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bài giảng đã đăng</h2>
          <p className="text-sm text-slate-400">Video / tài liệu theo lớp.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Tải bài giảng mới (mock)
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Thời lượng</th>
              <th className="px-4 py-3">Lượt xem</th>
              <th className="px-4 py-3">Cập nhật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {mockTeacherLessons.map((l) => (
              <tr key={l.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-emerald-300">{l.id}</td>
                <td className="px-4 py-3">{l.title}</td>
                <td className="px-4 py-3 text-slate-400">{l.className}</td>
                <td className="px-4 py-3">{l.duration}</td>
                <td className="px-4 py-3">{l.views}</td>
                <td className="px-4 py-3 text-slate-400">{l.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
