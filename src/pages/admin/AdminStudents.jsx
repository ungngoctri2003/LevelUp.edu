import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { ModalPortal } from '../../components/dashboard/ModalPortal'
import {
  inputAdmin,
  btnPrimaryAdmin,
  tableHeadAdmin,
  tableBodyAdmin,
  tableRowHover,
  tableShell,
  modalBackdrop,
  modalPanelAdmin,
  modalTitle,
  labelAdmin,
} from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'
import PageLoading from '../../components/ui/PageLoading.jsx'

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

const emptyCreateStudent = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  grade: 'Lớp 10',
}

export default function AdminStudents() {
  const {
    state,
    loading,
    error,
    refresh,
    attemptCounts,
    createStudentUser,
    updateStudent,
    toggleStudentActive,
    removeStudent,
  } = useAdminState()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [createDraft, setCreateDraft] = useState(emptyCreateStudent)

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
      toastActionError(err, 'Không lưu được thông tin học viên.')
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
        String(r.name || '')
          .toLowerCase()
          .includes(s) ||
        String(r.email || '')
          .toLowerCase()
          .includes(s) ||
        String(r.id).toLowerCase().includes(s) ||
        (r.phone && String(r.phone).includes(s)),
    )
  }, [q, state.students, statusFilter])

  const toggle = async (row) => {
    const learningActive = row.status === 'active' || row.status === 'trial'
    try {
      await toggleStudentActive(row.id, !learningActive)
    } catch (err) {
      toastActionError(err, 'Không cập nhật được trạng thái học viên.')
    }
  }

  const submitCreateStudent = async (e) => {
    e.preventDefault()
    if (!createDraft.email.trim() || !createDraft.password || !createDraft.fullName.trim()) {
      toast.warning('Vui lòng nhập email, mật khẩu và họ tên.')
      return
    }
    try {
      await createStudentUser({
        email: createDraft.email.trim(),
        password: createDraft.password,
        fullName: createDraft.fullName.trim(),
        phone: createDraft.phone.trim(),
        grade: createDraft.grade.trim(),
      })
      setCreateDraft(emptyCreateStudent)
      toast.success('Đã tạo tài khoản. Gửi email và mật khẩu cho học viên qua kênh riêng tư.', { duration: 6000 })
    } catch (err) {
      toastActionError(err, 'Không tạo được tài khoản học viên.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quản lý học viên"
        description="Tạo tài khoản mới hoặc quản lý học viên đã có: thông tin, trạng thái học tập và tài khoản."
        badge="Student"
      />

      {loading && <PageLoading variant="inline" />}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputAdmin} min-w-[160px]`}
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
          className={`${inputAdmin} w-full min-w-0 sm:max-w-md sm:flex-1`}
        />
      </div>

      <Panel
        variant="highlight"
        title="Thêm học viên mới"
        subtitle="Tạo tài khoản đăng nhập và gửi mật khẩu tạm cho học viên (tối thiểu 6 ký tự)."
      >
        <form onSubmit={submitCreateStudent} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="email"
              required
              value={createDraft.email}
              onChange={(e) => setCreateDraft((d) => ({ ...d, email: e.target.value }))}
              placeholder="Email đăng nhập"
              className={inputAdmin}
              autoComplete="off"
            />
            <input
              type="password"
              required
              minLength={6}
              value={createDraft.password}
              onChange={(e) => setCreateDraft((d) => ({ ...d, password: e.target.value }))}
              placeholder="Mật khẩu tạm"
              className={inputAdmin}
              autoComplete="new-password"
            />
            <input
              required
              value={createDraft.fullName}
              onChange={(e) => setCreateDraft((d) => ({ ...d, fullName: e.target.value }))}
              placeholder="Họ và tên"
              className={inputAdmin}
            />
            <input
              value={createDraft.phone}
              onChange={(e) => setCreateDraft((d) => ({ ...d, phone: e.target.value }))}
              placeholder="Số điện thoại (tuỳ chọn)"
              className={inputAdmin}
            />
            <input
              value={createDraft.grade}
              onChange={(e) => setCreateDraft((d) => ({ ...d, grade: e.target.value }))}
              placeholder="Khối / lớp"
              className={inputAdmin}
            />
          </div>
          <button type="submit" className={btnPrimaryAdmin} disabled={loading}>
            Tạo tài khoản học viên
          </button>
        </form>
      </Panel>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className={tableShell}>
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className={tableHeadAdmin}>
              <tr>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">SĐT</th>
                <th className="px-4 py-3">Khối</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Bài thi</th>
                <th className="px-4 py-3">Tham gia</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className={tableBodyAdmin}>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center align-top">
                    <p className="text-slate-600 dark:text-slate-300">
                      {state.students.length === 0
                        ? 'Chưa có học viên nào.'
                        : 'Không có dòng nào khớp bộ lọc hoặc tìm kiếm.'}
                    </p>
                    {state.students.length === 0 && (
                      <div className="mx-auto mt-4 max-w-lg space-y-2 text-sm text-slate-500">
                        <p>Học viên đăng ký trên website sẽ xuất hiện trong danh sách này.</p>
                        <p>
                          Khi đã có dữ liệu, bạn có thể sửa thông tin, khóa hoặc mở học tập, vô hiệu hóa tài khoản ở
                          cột Thao tác.
                        </p>
                        <button
                          type="button"
                          onClick={() => refresh()}
                          className="mt-3 rounded-xl border border-gray-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          Tải lại danh sách
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className={tableRowHover}>
                  <td className="px-4 py-3" title={`Mã tài khoản: ${r.id}`}>
                    <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                    {r.source === 'registered' && (
                      <span className="ml-1 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] text-fuchsia-200">ĐK</span>
                    )}
                    {r.source === 'manual' && (
                      <span className="ml-1 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-200">Thủ công</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.phone || '—'}</td>
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
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{attemptCounts[r.id] ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(r)} className="text-xs text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                        Sửa
                      </button>
                      <button type="button" onClick={() => toggle(r)} className="text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300">
                        {r.status === 'inactive' ? 'Mở' : 'Khóa'}
                      </button>
                      <button type="button" onClick={() => removeStudent(r.id)} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
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
        <ModalPortal>
        <div className={modalBackdrop}>
          <form onSubmit={save} className={`${modalPanelAdmin} max-h-[90vh] overflow-y-auto`}>
            <h3 className={modalTitle}>Sửa học viên</h3>
            <p className="mt-1 text-xs text-slate-500">Mã tài khoản: {form.id}</p>
            <label className={`mt-4 ${labelAdmin}`}>
              Họ tên
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={`${inputAdmin} mt-1 w-full`}
              />
            </label>
            <label className={`mt-3 ${labelAdmin}`}>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={`${inputAdmin} mt-1 w-full`}
              />
            </label>
            <label className={`mt-3 ${labelAdmin}`}>
              SĐT
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={`${inputAdmin} mt-1 w-full`}
              />
            </label>
            <label className={`mt-3 ${labelAdmin}`}>
              Khối
              <input
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                className={`${inputAdmin} mt-1 w-full`}
              />
            </label>
            <label className={`mt-3 ${labelAdmin}`}>
              Trạng thái học tập
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={`${inputAdmin} mt-1 w-full`}
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
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Hủy
              </button>
              <button type="submit" className={btnPrimaryAdmin}>
                Lưu
              </button>
            </div>
          </form>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
