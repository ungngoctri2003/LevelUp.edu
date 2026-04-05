import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { inputAdmin, btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { useAdminState } from '../../hooks/useAdminState'
import * as srv from '../../services/adminServerApi.js'

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

const tabBtn =
  'rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5 sm:py-3 sm:text-base'

function toCsv(rows) {
  const headers = ['id', 'full_name', 'email', 'phone', 'course_interest', 'created_at']
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      headers
        .map((h) => {
          const v = r[h]
          if (v == null) return '""'
          const s = String(v).replace(/"/g, '""')
          return `"${s}"`
        })
        .join(','),
    )
  }
  return lines.join('\n')
}

export default function AdminAdmissions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'leads' ? 'leads' : 'hosos'

  const setTab = (next) => {
    if (next === 'leads') setSearchParams({ tab: 'leads' }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  const { session } = useAuthSession()
  const token = session?.access_token

  const { state, loading, error, addAdmission, setAdmissionStatus, deleteAdmission } = useAdminState()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState(emptyForm)

  const [leadRows, setLeadRows] = useState([])
  const [leadTotal, setLeadTotal] = useState(0)
  const [leadOffset, setLeadOffset] = useState(0)
  const leadLimit = 100
  const [leadLoading, setLeadLoading] = useState(false)

  const loadLeads = useCallback(async () => {
    if (!token) {
      setLeadRows([])
      setLeadLoading(false)
      return
    }
    setLeadLoading(true)
    try {
      const res = await srv.adminListMarketingLeads(token, leadLimit, leadOffset)
      const payload = res.data || {}
      setLeadRows(payload.rows || [])
      setLeadTotal(payload.total ?? (payload.rows || []).length)
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminAdmissions leads]', e)
      toast.error('Không tải được danh sách lead.')
      setLeadRows([])
    } finally {
      setLeadLoading(false)
    }
  }, [token, leadOffset])

  useEffect(() => {
    if (tab === 'leads') loadLeads()
  }, [tab, loadLeads])

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

  const downloadCsv = () => {
    const blob = new Blob([toCsv(leadRows)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `marketing-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tuyển sinh & lead đăng ký"
        description={
          <>
            <strong className="text-slate-300">Hồ sơ tuyển sinh</strong> — từ{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/tuyen-sinh">
              trang Tuyển sinh
            </Link>{' '}
            và nhập tay. <strong className="text-slate-300">Lead đăng ký</strong> — form nhận tư vấn trên trang chủ.
          </>
        }
        badge="CRM"
      >
        {tab === 'leads' && (
          <button type="button" onClick={downloadCsv} className={btnPrimaryAdmin} disabled={!leadRows.length}>
            Tải CSV (trang hiện tại)
          </button>
        )}
      </PageHeader>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setTab('hosos')}
          className={`${tabBtn} ${
            tab === 'hosos'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
              : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          Hồ sơ tuyển sinh
        </button>
        <button
          type="button"
          onClick={() => setTab('leads')}
          className={`${tabBtn} ${
            tab === 'leads'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
              : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          Lead đăng ký
        </button>
      </div>

      {tab === 'hosos' && (
        <>
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
        </>
      )}

      {tab === 'leads' && (
        <>
          {leadLoading && <p className="text-sm text-slate-400">Đang tải…</p>}

          <p className="text-sm text-slate-500">
            Tổng khoảng {leadTotal} mục — đang xem {leadRows.length} mục (trang {Math.floor(leadOffset / leadLimit) + 1})
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={leadOffset === 0 || leadLoading}
              onClick={() => setLeadOffset((o) => Math.max(0, o - leadLimit))}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={leadRows.length < leadLimit || leadLoading}
              onClick={() => setLeadOffset((o) => o + leadLimit)}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>

          <Panel title="Danh sách lead" noDivider padding={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className={tableHeadAdmin}>
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Họ tên</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Điện thoại</th>
                    <th className="px-4 py-3">Khóa quan tâm</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {leadRows.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-mono text-slate-500">{r.id}</td>
                      <td className="px-4 py-3 font-medium">{r.full_name}</td>
                      <td className="px-4 py-3 text-cyan-200/90">{r.email}</td>
                      <td className="px-4 py-3 text-slate-400">{r.phone}</td>
                      <td className="px-4 py-3 text-slate-400">{r.course_interest || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
