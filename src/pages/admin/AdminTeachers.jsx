import { useMemo, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import {
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
  btnPrimaryAdmin,
  tableHeadAdmin,
} from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'

const statusUi = {
  approved: { label: 'Đã duyệt', className: 'bg-emerald-500/20 text-emerald-300' },
  pending: { label: 'Chờ duyệt', className: 'bg-amber-500/20 text-amber-200' },
  suspended: { label: 'Tạm khóa', className: 'bg-red-500/20 text-red-300' },
}

const emptyForm = {
  id: '',
  name: '',
  email: '',
  subjects: '',
  classes: 1,
  status: 'pending',
}

export default function AdminTeachers() {
  const { state, loading, error, updateTeacher, setTeacherApproval, removeTeacher } = useAdminState()
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
        String(r.id).toLowerCase().includes(s) ||
        r.subjects.toLowerCase().includes(s),
    )
  }, [q, state.teachers])

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

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.id) return
    try {
      await updateTeacher(form.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        subjects: form.subjects.trim() || '—',
        classes: form.classes,
        status: form.status,
      })
      setModal(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const approve = async (id) => {
    try {
      await setTeacherApproval(id, 'approved')
    } catch (err) {
      alert(err.message)
    }
  }

  const setStatus = async (id, nextStatus) => {
    try {
      await setTeacherApproval(id, nextStatus)
    } catch (err) {
      alert(err.message)
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quản lý giáo viên"
        description="Tài khoản giáo viên cần có role=teacher trong Supabase (SQL hoặc Dashboard). Tại đây chỉnh duyệt và hồ sơ."
        badge="Nhân sự"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, môn..."
          className={`${inputAdmin} w-full sm:max-w-md`}
        />
      </div>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className={tableHeadAdmin}>
              <tr>
                <th className="px-4 py-3">UUID</th>
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
                  <td className="max-w-[100px] truncate px-4 py-3 font-mono text-[10px] text-fuchsia-300" title={r.id}>
                    {r.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-slate-400">{r.email}</td>
                  <td className="px-4 py-3">{r.subjects}</td>
                  <td className="px-4 py-3">{r.classes}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusUi[r.status]?.className || statusUi.pending.className}`}
                    >
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
                        <button type="button" onClick={() => setStatus(r.id, 'suspended')} className="font-medium text-amber-400 hover:text-amber-300">
                          Tạm khóa
                        </button>
                      )}
                      {r.status === 'suspended' && (
                        <button type="button" onClick={() => setStatus(r.id, 'approved')} className="font-medium text-emerald-400 hover:text-emerald-300">
                          Mở khóa
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button type="button" onClick={() => setStatus(r.id, 'suspended')} className="font-medium text-slate-500 hover:text-slate-400">
                          Từ chối
                        </button>
                      )}
                      <button type="button" onClick={() => removeTeacher(r.id)} className="font-medium text-red-400 hover:text-red-300">
                        Tạm khóa nhanh
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
        <div className={modalBackdrop}>
          <form onSubmit={save} className={`${modalPanelAdmin} max-w-md`}>
            <h3 className="text-lg font-semibold text-white">Sửa giáo viên</h3>
            <p className="mt-1 text-xs text-slate-500">UUID: {form.id}</p>
            <label className="mt-4 block text-sm text-slate-400">
              Họ tên
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Môn dạy
              <input
                value={form.subjects}
                onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
                placeholder="VD: Toán, Vật lý"
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Số lớp phụ trách (cache)
              <input
                type="number"
                min={0}
                value={form.classes}
                onChange={(e) => setForm((f) => ({ ...f, classes: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Trạng thái duyệt
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={field}
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
              <button type="submit" className={btnPrimaryAdmin}>
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
