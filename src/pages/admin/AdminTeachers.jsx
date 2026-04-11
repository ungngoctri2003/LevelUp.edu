import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { ModalPortal } from '../../components/dashboard/ModalPortal'
import {
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
  btnPrimaryAdmin,
  tableHeadAdmin,
  tableBodyAdmin,
  tableRowHover,
  tableShell,
} from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'
import PageLoading from '../../components/ui/PageLoading.jsx'

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
  status: 'pending',
}

const emptyCreateTeacher = {
  email: '',
  password: '',
  fullName: '',
  subjects: '',
}

export default function AdminTeachers() {
  const {
    state,
    loading,
    error,
    refresh,
    createTeacherUser,
    updateTeacher,
    setTeacherApproval,
  } = useAdminState()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [createDraft, setCreateDraft] = useState(emptyCreateTeacher)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    let rows = state.teachers
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
        String(r.subjects || '')
          .toLowerCase()
          .includes(s),
    )
  }, [q, state.teachers])

  const teacherClassCountEdit = useMemo(() => {
    if (!form.id) return 0
    return state.classes.filter((c) => c.teacher_id === form.id).length
  }, [form.id, state.classes])

  const openEdit = (r) => {
    setModal('edit')
    setForm({
      id: r.id,
      name: r.name,
      email: r.email,
      subjects: r.subjects,
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
        status: form.status,
      })
      setModal(null)
    } catch (err) {
      toastActionError(err, 'Không lưu được thông tin giáo viên.')
    }
  }

  const approve = async (id) => {
    try {
      await setTeacherApproval(id, 'approved')
    } catch (err) {
      toastActionError(err, 'Không duyệt được giáo viên.')
    }
  }

  const setStatus = async (id, nextStatus) => {
    try {
      await setTeacherApproval(id, nextStatus)
    } catch (err) {
      toastActionError(err, 'Không cập nhật được trạng thái.')
    }
  }

  const submitCreateTeacher = async (e) => {
    e.preventDefault()
    if (!createDraft.email.trim() || !createDraft.password || !createDraft.fullName.trim()) {
      toast.warning('Vui lòng nhập email, mật khẩu và họ tên.')
      return
    }
    try {
      await createTeacherUser({
        email: createDraft.email.trim(),
        password: createDraft.password,
        fullName: createDraft.fullName.trim(),
        subjects: createDraft.subjects.trim(),
      })
      setCreateDraft(emptyCreateTeacher)
      toast.success(
        'Đã tạo tài khoản giáo viên (chờ duyệt). Gửi thông tin đăng nhập qua kênh riêng tư.',
        { duration: 6000 },
      )
    } catch (err) {
      toastActionError(err, 'Không tạo được tài khoản giáo viên.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quản lý giáo viên"
        description="Tạo tài khoản và duyệt hồ sơ. Gán lớp và học viên tại mục «Lớp & học viên» trên menu."
        badge="Nhân sự"
      />

      {loading && <PageLoading variant="inline" />}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, môn..."
          className={`${inputAdmin} w-full sm:max-w-md`}
        />
      </div>

      <Panel
        variant="highlight"
        title="Thêm giáo viên mới"
        subtitle="Tạo tài khoản đăng nhập; hồ sơ ở trạng thái chờ duyệt cho đến khi bạn duyệt (mật khẩu tối thiểu 6 ký tự)."
      >
        <form onSubmit={submitCreateTeacher} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              value={createDraft.subjects}
              onChange={(e) => setCreateDraft((d) => ({ ...d, subjects: e.target.value }))}
              placeholder="Môn dạy (tuỳ chọn)"
              className={inputAdmin}
            />
          </div>
          <button type="submit" className={btnPrimaryAdmin} disabled={loading}>
            Tạo tài khoản giáo viên
          </button>
        </form>
      </Panel>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className={tableShell}>
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className={tableHeadAdmin}>
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
            <tbody className={tableBodyAdmin}>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center align-top">
                    <p className="text-slate-300">
                      {state.teachers.length === 0
                        ? 'Chưa có giáo viên nào.'
                        : 'Không có dòng nào khớp tìm kiếm.'}
                    </p>
                    {state.teachers.length === 0 && (
                      <div className="mx-auto mt-4 max-w-lg space-y-2 text-sm text-slate-500">
                        <p>
                          Khi tài khoản giáo viên được thêm vào hệ thống, họ sẽ hiển thị tại đây. Bạn có thể sửa hồ
                          sơ, duyệt hoặc tạm khóa từ cột Thao tác.
                        </p>
                        <p>Nếu vừa thêm tài khoản mới, hãy bấm tải lại bên dưới.</p>
                        <button
                          type="button"
                          onClick={() => refresh()}
                          className="mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
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
                      <Link
                        to={`/admin/lop-hoc?gv=${encodeURIComponent(r.id)}`}
                        className="font-medium text-violet-400 hover:text-violet-300"
                      >
                        Lớp &amp; học viên
                      </Link>
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
          <form onSubmit={save} className={`${modalPanelAdmin} max-w-md`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sửa giáo viên</h3>
            <p className="mt-1 text-xs text-slate-500">Mã tài khoản: {form.id}</p>
            <p className="mt-2 text-sm text-slate-400">
              Số lớp đang phụ trách:{' '}
              <span className="font-medium text-slate-200">{teacherClassCountEdit}</span> (theo dữ liệu lớp học)
            </p>
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
