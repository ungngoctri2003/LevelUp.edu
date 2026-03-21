import { useState } from 'react'
import { mockAdmissions } from '../../data/dashboardData'

const labels = {
  new: 'Mới',
  reviewing: 'Đang xét',
  accepted: 'Đã nhận',
  rejected: 'Từ chối',
}

export default function AdminAdmissions() {
  const [rows, setRows] = useState(mockAdmissions)

  const setStatus = (id, status) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Hồ sơ tuyển sinh</h2>
        <p className="text-sm text-slate-400">Theo dõi và cập nhật trạng thái xét duyệt.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Học sinh</th>
              <th className="px-4 py-3">Phụ huynh</th>
              <th className="px-4 py-3">Khối</th>
              <th className="px-4 py-3">Gửi lúc</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-cyan-300">{r.id}</td>
                <td className="px-4 py-3">{r.studentName}</td>
                <td className="px-4 py-3 text-slate-400">{r.parentPhone}</td>
                <td className="px-4 py-3">{r.grade}</td>
                <td className="px-4 py-3 text-slate-400">{r.submitted}</td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => setStatus(r.id, e.target.value)}
                    className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
                  >
                    {Object.keys(labels).map((k) => (
                      <option key={k} value={k}>
                        {labels[k]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
