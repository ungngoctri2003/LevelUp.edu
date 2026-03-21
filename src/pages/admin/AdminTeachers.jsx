import { useMemo, useState } from 'react'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

const statusUi = {
  approved: { label: 'Đã duyệt', className: 'bg-emerald-500/20 text-emerald-300' },
  pending: { label: 'Chờ duyệt', className: 'bg-amber-500/20 text-amber-200' },
  suspended: { label: 'Tạm khóa', className: 'bg-red-500/20 text-red-300' },
}

export default function AdminTeachers() {
  const { state, update } = useAdminState()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    let rows = state.teachers
    if (!s) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s) ||
        r.subjects.toLowerCase().includes(s),
    )
  }, [q, state.teachers])

  function setTeacherStatus(id, nextStatus) {
    const row = state.teachers.find((x) => x.id === id)
    update((prev) => ({
      ...prev,
      teachers: prev.teachers.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)),
    }))
    if (!row) return
    const msg =
      nextStatus === 'approved'
        ? `Duyệt / mở khóa GV: ${row.email}`
        : nextStatus === 'suspended'
          ? `Tạm khóa hoặc từ chối GV: ${row.email}`
          : ''
    if (msg) appendAdminActivity(msg)
  }

  const approve = (id) => setTeacherStatus(id, 'approved')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Quản lý giáo viên</h2>
          <p className="text-sm text-slate-400">Duyệt hồ sơ, tạm khóa tài khoản — lưu cục bộ.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, môn..."
          className="w-full max-w-md rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none sm:w-80"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Môn</th>
              <th className="px-4 py-3">Số lớp</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-fuchsia-300">{r.id}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 text-slate-400">{r.email}</td>
                <td className="px-4 py-3">{r.subjects}</td>
                <td className="px-4 py-3">{r.classes}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusUi[r.status]?.className || statusUi.pending.className}`}>
                    {statusUi[r.status]?.label || r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap gap-2">
                    {r.status === 'pending' && (
                      <button type="button" onClick={() => approve(r.id)} className="font-medium text-cyan-400 hover:text-cyan-300">
                        Duyệt
                      </button>
                    )}
                    {r.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => setTeacherStatus(r.id, 'suspended')}
                        className="font-medium text-amber-400 hover:text-amber-300"
                      >
                        Tạm khóa
                      </button>
                    )}
                    {r.status === 'suspended' && (
                      <button
                        type="button"
                        onClick={() => setTeacherStatus(r.id, 'approved')}
                        className="font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Mở khóa
                      </button>
                    )}
                    {r.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => setTeacherStatus(r.id, 'suspended')}
                        className="font-medium text-slate-500 hover:text-slate-400"
                      >
                        Từ chối
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
