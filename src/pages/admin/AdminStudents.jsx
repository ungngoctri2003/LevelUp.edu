import { useMemo, useState } from 'react'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity, getStudentTestCount } from '../../utils/adminStorage'

const statusLabel = {
  active: 'Đang học',
  inactive: 'Tạm dừng',
  trial: 'Học thử',
}

export default function AdminStudents() {
  const { state, update } = useAdminState()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = state.students
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter)
    }
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s) ||
        (r.phone && String(r.phone).includes(s)),
    )
  }, [q, state.students, statusFilter])

  const toggle = (id) => {
    const row = state.students.find((x) => x.id === id)
    if (!row) return
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    update((prev) => ({
      ...prev,
      students: prev.students.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    }))
    appendAdminActivity(`${newStatus === 'inactive' ? 'Khóa' : 'Mở'} tài khoản: ${row.email}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Quản lý học viên</h2>
          <p className="text-sm text-slate-400">
            Gồm học viên mẫu và tài khoản đăng ký mới — lưu cục bộ. Cột &quot;Bài thi&quot; lấy từ lịch sử làm bài trên thiết bị này.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="active">Đang học</option>
            <option value="trial">Học thử</option>
            <option value="inactive">Tạm dừng</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT, mã..."
            className="w-full max-w-md rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">SĐT</th>
              <th className="px-4 py-3">Khối</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Bài thi</th>
              <th className="px-4 py-3">Tham gia</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-cyan-300">{r.id}</td>
                <td className="px-4 py-3">
                  {r.name}
                  {r.source === 'registered' && (
                    <span className="ml-1 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] text-fuchsia-200">ĐK</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400">{r.email}</td>
                <td className="px-4 py-3 text-slate-400">{r.phone || '—'}</td>
                <td className="px-4 py-3">{r.grade}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : r.status === 'trial'
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {statusLabel[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{getStudentTestCount(r.email)}</td>
                <td className="px-4 py-3 text-slate-400">{r.joined}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(r.id)}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    {r.status === 'active' ? 'Khóa' : 'Mở'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
