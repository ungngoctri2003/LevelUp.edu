import { exams } from '../../data'

export default function AdminExams() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bài kiểm tra & đề</h2>
          <p className="text-sm text-slate-400">Quản lý đề thi, thời lượng, trạng thái giao bài.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-dashed border-cyan-500/40 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10"
        >
          + Tạo đề mới (mock)
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Tên đề</th>
              <th className="px-4 py-3">Môn</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Số câu</th>
              <th className="px-4 py-3">Cấp</th>
              <th className="px-4 py-3">Đã giao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {exams.map((e) => (
              <tr key={e.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3 text-slate-400">{e.subject}</td>
                <td className="px-4 py-3">{e.duration} phút</td>
                <td className="px-4 py-3">{e.questions}</td>
                <td className="px-4 py-3">{e.level}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      e.assigned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {e.assigned ? 'Có' : 'Chưa'}
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
