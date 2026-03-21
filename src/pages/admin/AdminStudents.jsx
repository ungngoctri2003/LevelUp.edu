import { useMemo, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity, getStudentTestCount } from '../../utils/adminStorage'

const statusLabel = {
  active: 'Đang học',
  inactive: 'Tạm dừng',
  trial: 'Học thử',
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  grade: 'Lớp 10',
  status: 'active',
  joined: '',
}

export default function AdminStudents() {
  const { state, update } = useAdminState()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const openCreate = () => {
    setModal('create')
    setForm({
      ...emptyForm,
      joined: new Date().toLocaleDateString('vi-VN'),
    })
  }

  const openEdit = (r) => {
    setModal('edit')
    setForm({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      grade: r.grade,
      status: r.status,
      joined: r.joined,
    })
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    if (modal === 'create') {
      const id = `HV${Date.now().toString(36).toUpperCase().slice(-6)}`
      update((prev) => ({
        ...prev,
        students: [
          {
            id,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            grade: form.grade.trim() || '—',
            status: form.status,
            joined: form.joined.trim() || new Date().toLocaleDateString('vi-VN'),
            source: 'manual',
          },
          ...prev.students,
        ],
      }))
      appendAdminActivity(`Thêm học viên: ${form.email.trim()}`)
    } else if (modal === 'edit' && form.id) {
      update((prev) => ({
        ...prev,
        students: prev.students.map((r) =>
          r.id === form.id
            ? {
                ...r,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                grade: form.grade.trim() || '—',
                status: form.status,
                joined: form.joined.trim() || r.joined,
              }
            : r,
        ),
      }))
      appendAdminActivity(`Cập nhật học viên: ${form.email.trim()}`)
    }
    setModal(null)
  }

  const remove = (r) => {
    if (!confirm(`Xóa học viên "${r.name}" (${r.id})?`)) return
    update((prev) => ({
      ...prev,
      students: prev.students.filter((x) => x.id !== r.id),
    }))
    appendAdminActivity(`Xóa học viên: ${r.email}`)
  }

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

  const inputCls =
    'rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15'

  return (
    <div className="space-y-8">
      <PageHeader title="Quản lý học viên" description="Thêm, sửa, khóa và tìm kiếm — dữ liệu lưu cục bộ trên trình duyệt." badge="CRUD" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/15 transition hover:opacity-95"
        >
          + Thêm học viên
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputCls} min-w-[160px]`}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang học</option>
          <option value="trial">Học thử</option>
          <option value="inactive">Tạm dừng</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, mã..."
          className={`${inputCls} w-full min-w-0 sm:max-w-md sm:flex-1`}
        />
      </div>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-white/10 bg-black/20 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                  {r.source === 'manual' && (
                    <span className="ml-1 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-200">Thủ công</span>
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
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEdit(r)} className="text-xs text-cyan-400 hover:text-cyan-300">
                      Sửa
                    </button>
                    <button type="button" onClick={() => toggle(r.id)} className="text-xs text-amber-400 hover:text-amber-300">
                      {r.status === 'active' ? 'Khóa' : 'Mở'}
                    </button>
                    <button type="button" onClick={() => remove(r)} className="text-xs text-red-400 hover:text-red-300">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Panel>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-500/10 ring-1 ring-white/10"
          >
            <h3 className="text-lg font-semibold text-white">{modal === 'create' ? 'Thêm học viên' : 'Sửa học viên'}</h3>
            {modal === 'edit' && <p className="mt-1 text-xs text-slate-500">Mã: {form.id}</p>}
            <label className="mt-4 block text-sm text-slate-400">
              Họ tên
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={`${inputCls} mt-1 w-full`}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={`${inputCls} mt-1 w-full`}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              SĐT
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={`${inputCls} mt-1 w-full`}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Khối
              <input
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                className={`${inputCls} mt-1 w-full`}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Trạng thái
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={`${inputCls} mt-1 w-full`}
              >
                <option value="active">Đang học</option>
                <option value="trial">Học thử</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Ngày tham gia
              <input
                value={form.joined}
                onChange={(e) => setForm((f) => ({ ...f, joined: e.target.value }))}
                className={`${inputCls} mt-1 w-full`}
              />
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
