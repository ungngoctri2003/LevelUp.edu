import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'

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
  const { state, loading, error, addAdmission, setAdmissionStatus, deleteAdmission } = useAdminState()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState(emptyForm)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    let rows = state.admissions
    if (!s) return rows
    return rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(s) ||
        String(r.id).toLowerCase().includes(s) ||
        r.parentPhone.includes(s),
    )
  }, [q, state.admissions])

  const addRow = async (e) => {
    e.preventDefault()
    if (!draft.studentName.trim()) return
    try {
      await addAdmission(draft)
      setDraft(emptyForm)
    } catch (err) {
      toastActionError(err, 'Không thêm được hồ sơ.')
    }
  }

  const setStatus = async (id, status) => {
    try {
      await setAdmissionStatus(id, status)
    } catch (err) {
      toastActionError(err, 'Không cập nhật được trạng thái hồ sơ.')
    }
  }

  const remove = async (r) => {
    if (!confirm(`Xóa hồ sơ ${r.id} — ${r.studentName}?`)) return
    try {
      await deleteAdmission(r.id)
    } catch (err) {
      toastActionError(err, 'Không xóa được hồ sơ.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hồ sơ tuyển sinh"
        description={
          <>
            Theo dõi hồ sơ gửi từ{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/tuyen-sinh">
              trang Tuyển sinh
            </Link>
            , và có thể nhập thêm hồ sơ thủ công bên dưới.
          </>
        }
        badge="Tuyển sinh"
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="flex justify-end">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, mã, SĐT..."
          className={`${inputAdmin} w-full max-w-md`}
        />
      </div>

      <Panel variant="highlight" title="Thêm hồ sơ (nhập tay)" subtitle="Dùng khi tiếp nhận hồ sơ ngoài form online.">
        <form onSubmit={addRow} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={draft.studentName}
              onChange={(e) => setDraft((d) => ({ ...d, studentName: e.target.value }))}
              placeholder="Họ tên học sinh"
              className={inputAdmin}
            />
            <input
              value={draft.parentPhone}
              onChange={(e) => setDraft((d) => ({ ...d, parentPhone: e.target.value }))}
              placeholder="SĐT phụ huynh"
              className={inputAdmin}
            />
            <input
              value={draft.grade}
              onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value }))}
              placeholder="Khối"
              className={inputAdmin}
            />
            <select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              className={inputAdmin}
            >
              {Object.keys(labels).map((k) => (
                <option key={k} value={k}>
                  {labels[k]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={btnPrimaryAdmin} disabled={loading}>
            Thêm hồ sơ
          </button>
        </form>
      </Panel>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className={tableHeadAdmin}>
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
                      className={`${inputAdmin} px-2 py-1 text-xs`}
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
      </Panel>
    </div>
  )
}
