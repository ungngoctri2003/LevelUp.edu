import { useMemo, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAdminState } from '../../hooks/useAdminState'

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
}

export default function AdminStudents() {
  const {
    state,
    loading,
    error,
    attemptCounts,
    updateStudent,
    toggleStudentActive,
    removeStudent,
  } = useAdminState()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const openEdit = (r) => {
    setModal('edit')
    setForm({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      grade: r.grade,
      status: r.status,
    })
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.id) return
    try {
      await updateStudent(form.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        grade: form.grade.trim() || '—',
        status: form.status,
      })
      setModal(null)
    } catch (err) {
      alert(err.message)
    }
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
        String(r.id).toLowerCase().includes(s) ||
        (r.phone && String(r.phone).includes(s)),
    )
  }, [q, state.students, statusFilter])

  const toggle = async (row) => {
    const learningActive = row.status === 'active' || row.status === 'trial'
    try {
      await toggleStudentActive(row.id, !learningActive)
    } catch (err) {
      alert(err.message)
    }
  }

  const inputCls =
    'rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/15'

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quản lý học viên"
        description="Danh sách từ bảng profiles + student_profiles (đăng ký qua Supabase Auth). Thêm tài khoản mới: Authentication trong Supabase."
        badge="CRUD"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
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
          placeholder="Tìm theo tên, email, UUID..."
          className={`${inputCls} w-full min-w-0 sm:max-w-md sm:flex-1`}
        />
      </div>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-white/10 bg-black/20 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">UUID</th>
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
                  <td className="max-w-[120px] truncate px-4 py-3 font-mono text-[10px] text-cyan-300" title={r.id}>
                    {r.id.slice(0, 8)}…
                  </td>
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
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{attemptCounts[r.id] ?? 0}</td>
                  <td className="px-4 py-3 text-slate-400">{r.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(r)} className="text-xs text-cyan-400 hover:text-cyan-300">
                        Sửa
                      </button>
                      <button type="button" onClick={() => toggle(r)} className="text-xs text-amber-400 hover:text-amber-300">
                        {r.status === 'inactive' ? 'Mở' : 'Khóa'}
                      </button>
                      <button type="button" onClick={() => removeStudent(r.id)} className="text-xs text-red-400 hover:text-red-300">
                        Vô hiệu hóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {modal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-500/10 ring-1 ring-white/10"
          >
            <h3 className="text-lg font-semibold text-white">Sửa học viên</h3>
            <p className="mt-1 text-xs text-slate-500">UUID: {form.id}</p>
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
              Trạng thái học tập
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
