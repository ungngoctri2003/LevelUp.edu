import { useMemo, useState } from 'react'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

const statusUi = {
  approved: { label: 'Đã duyệt', className: 'bg-emerald-500/20 text-emerald-300' },
  pending: { label: 'Chờ duyệt', className: 'bg-amber-500/20 text-amber-200' },
  suspended: { label: 'Tạm khóa', className: 'bg-red-500/20 text-red-300' },
}

const emptyForm = {
  name: '',
  email: '',
  subjects: '',
  classes: 1,
  status: 'pending',
}

export default function AdminTeachers() {
  const { state, update } = useAdminState()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)

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

  const openCreate = () => {
    setModal('create')
    setForm(emptyForm)
  }

  const openEdit = (r) => {
    setModal('edit')
    setForm({
      id: r.id,
      name: r.name,
      email: r.email,
      subjects: r.subjects,
      classes: r.classes,
      status: r.status,
    })
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    if (modal === 'create') {
      const id = `GV${Date.now().toString(36).toUpperCase().slice(-6)}`
      update((prev) => ({
        ...prev,
        teachers: [
          {
            id,
            name: form.name.trim(),
            email: form.email.trim(),
            subjects: form.subjects.trim() || '—',
            classes: Math.max(0, Number(form.classes) || 0),
            status: form.status,
          },
          ...prev.teachers,
        ],
      }))
      appendAdminActivity(`Thêm giáo viên: ${form.email.trim()}`)
    } else if (modal === 'edit' && form.id) {
      update((prev) => ({
        ...prev,
        teachers: prev.teachers.map((r) =>
          r.id === form.id
            ? {
                ...r,
                name: form.name.trim(),
                email: form.email.trim(),
                subjects: form.subjects.trim() || '—',
                classes: Math.max(0, Number(form.classes) || 0),
                status: form.status,
              }
            : r,
        ),
      }))
      appendAdminActivity(`Cập nhật giáo viên: ${form.email.trim()}`)
    }
    setModal(null)
  }

  const remove = (r) => {
    if (!confirm(`Xóa giáo viên "${r.name}" (${r.id})?`)) return
    update((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((x) => x.id !== r.id),
    }))
    appendAdminActivity(`Xóa giáo viên: ${r.email}`)
  }

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
          <p className="text-sm text-slate-400">CRUD đầy đủ — duyệt / khóa — lưu cục bộ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            + Thêm giáo viên
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full max-w-md rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none sm:w-80"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[900px] text-left text-sm">
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
                    <button type="button" onClick={() => openEdit(r)} className="font-medium text-cyan-400 hover:text-cyan-300">
                      Sửa
                    </button>
                    {r.status === 'pending' && (
                      <button type="button" onClick={() => approve(r.id)} className="font-medium text-emerald-400 hover:text-emerald-300">
                        Duyệt
                      </button>
                    )}
                    {r.status === 'approved' && (
                      <button type="button" onClick={() => setTeacherStatus(r.id, 'suspended')} className="font-medium text-amber-400 hover:text-amber-300">
                        Tạm khóa
                      </button>
                    )}
                    {r.status === 'suspended' && (
                      <button type="button" onClick={() => setTeacherStatus(r.id, 'approved')} className="font-medium text-emerald-400 hover:text-emerald-300">
                        Mở khóa
                      </button>
                    )}
                    {r.status === 'pending' && (
                      <button type="button" onClick={() => setTeacherStatus(r.id, 'suspended')} className="font-medium text-slate-500 hover:text-slate-400">
                        Từ chối
                      </button>
                    )}
                    <button type="button" onClick={() => remove(r)} className="font-medium text-red-400 hover:text-red-300">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">{modal === 'create' ? 'Thêm giáo viên' : 'Sửa giáo viên'}</h3>
            {modal === 'edit' && <p className="mt-1 text-xs text-slate-500">Mã: {form.id}</p>}
            <label className="mt-4 block text-sm text-slate-400">
              Họ tên
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Môn dạy
              <input
                value={form.subjects}
                onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
                placeholder="VD: Toán, Vật lý"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Số lớp phụ trách
              <input
                type="number"
                min={0}
                value={form.classes}
                onChange={(e) => setForm((f) => ({ ...f, classes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Trạng thái
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
              >
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="suspended">Tạm khóa</option>
              </select>
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Hủy
              </button>
              <button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white">
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
