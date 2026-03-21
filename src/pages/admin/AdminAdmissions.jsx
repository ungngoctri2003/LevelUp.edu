import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
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
    <div className="space-y-8">
      <PageHeader
        title="Hồ sơ tuyển sinh"
        description={
          <>
            CRUD — form công khai tại{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/tuyen-sinh">
              /tuyen-sinh
            </Link>
            .
          </>
        }
        badge="Tuyển sinh"
      />

      <div className="flex justify-end">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, mã, SĐT..."
          className={`${inputAdmin} w-full max-w-md`}
        />
      </div>

      <Panel variant="highlight" title="Thêm hồ sơ (nhập tay)" subtitle="Dùng khi cần nhập nhanh từ điện thoại hoặc giấy tờ.">
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
          <button type="submit" className={btnPrimaryAdmin}>
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
