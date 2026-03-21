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

const emptyForm = {
  studentName: '',
  parentPhone: '',
  grade: 'Lớp 10',
  status: 'new',
}

export default function AdminAdmissions() {
  const { state, update } = useAdminState()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState(emptyForm)

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

  const addRow = (e) => {
    e.preventDefault()
    if (!draft.studentName.trim()) return
    const nextId = `TS${Date.now().toString(36).toUpperCase().slice(-6)}`
    update((prev) => ({
      ...prev,
      admissions: [
        {
          id: nextId,
          studentName: draft.studentName.trim(),
          parentPhone: draft.parentPhone.trim() || '—',
          grade: draft.grade.trim() || '—',
          status: draft.status,
          submitted: new Date().toLocaleDateString('vi-VN'),
        },
        ...prev.admissions,
      ],
    }))
    appendAdminActivity(`Thêm hồ sơ tuyển sinh: ${draft.studentName.trim()}`)
    setDraft(emptyForm)
  }

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

  const remove = (r) => {
    if (!confirm(`Xóa hồ sơ ${r.id} — ${r.studentName}?`)) return
    update((prev) => ({
      ...prev,
      admissions: prev.admissions.filter((x) => x.id !== r.id),
    }))
    appendAdminActivity(`Xóa hồ sơ tuyển sinh: ${r.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Hồ sơ tuyển sinh</h2>
          <p className="text-sm text-slate-400">
            CRUD — form công khai tại{' '}
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

      <form onSubmit={addRow} className="rounded-2xl border border-dashed border-cyan-500/30 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="font-semibold text-white">Thêm hồ sơ (nhập tay)</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={draft.studentName}
            onChange={(e) => setDraft((d) => ({ ...d, studentName: e.target.value }))}
            placeholder="Họ tên học sinh"
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <input
            value={draft.parentPhone}
            onChange={(e) => setDraft((d) => ({ ...d, parentPhone: e.target.value }))}
            placeholder="SĐT phụ huynh"
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <input
            value={draft.grade}
            onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value }))}
            placeholder="Khối"
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <select
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
          >
            {Object.keys(labels).map((k) => (
              <option key={k} value={k}>
                {labels[k]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
          Thêm hồ sơ
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Học sinh</th>
              <th className="px-4 py-3">Phụ huynh</th>
              <th className="px-4 py-3">Khối</th>
              <th className="px-4 py-3">Gửi lúc</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
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
                <td className="px-4 py-3">
                  <button type="button" onClick={() => remove(r)} className="text-xs text-red-400 hover:text-red-300">
                    Xóa
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
