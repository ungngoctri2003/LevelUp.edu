import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

const labels = {
  new: 'Mới',
  reviewing: 'Đang xét',
  accepted: 'Đã nhận',
  rejected: 'Từ chối',
}

export default function AdminAdmissions() {
  const { state, update } = useAdminState()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    let rows = state.admissions
    if (!s) return rows
    return rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s) ||
        r.parentPhone.includes(s),
    )
  }, [q, state.admissions])

  const setStatus = (id, status) => {
    const row = state.admissions.find((x) => x.id === id)
    update((prev) => ({
      ...prev,
      admissions: prev.admissions.map((r) => (r.id === id ? { ...r, status } : r)),
    }))
    if (row && row.status !== status) {
      appendAdminActivity(`Cập nhật hồ sơ ${row.id}: ${labels[status]}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Hồ sơ tuyển sinh</h2>
          <p className="text-sm text-slate-400">
            Theo dõi trạng thái — form công khai tại{' '}
            <Link to="/tuyen-sinh" className="text-cyan-400 hover:text-cyan-300">
              /tuyen-sinh
            </Link>
            .
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, mã, SĐT..."
          className="w-full max-w-md rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none sm:w-72"
        />
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
            {filtered.map((r) => (
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
