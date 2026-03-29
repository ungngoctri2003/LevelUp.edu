import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { btnPrimaryAdmin, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { toast } from 'sonner'
import * as srv from '../../services/adminServerApi.js'

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

export default function AdminLeads() {
  const { session } = useAuthSession()
  const token = session?.access_token
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const limit = 100
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    if (!token) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await srv.adminListMarketingLeads(token, limit, offset)
      const payload = res.data || {}
      setRows(payload.rows || [])
      setTotal(payload.total ?? (payload.rows || []).length)
    } catch (e) {
      if (import.meta.env.DEV) console.error('[AdminLeads]', e)
      toast.error('Không tải được danh sách lead. Vui lòng thử lại sau.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [token, offset])

  useEffect(() => {
    load()
  }, [load])

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `marketing-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lead đăng ký"
        description="Dữ liệu từ form trang chủ (marketing_leads). Chỉ admin đọc qua API máy chủ."
        badge="CRM"
      >
        <button type="button" onClick={downloadCsv} className={btnPrimaryAdmin} disabled={!rows.length}>
          Tải CSV (trang hiện tại)
        </button>
      </PageHeader>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <p className="text-sm text-slate-500">
        Tổng ước: {total} — hiển thị {rows.length} (offset {offset})
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={offset === 0 || loading}
          onClick={() => setOffset((o) => Math.max(0, o - limit))}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
        >
          Trang trước
        </button>
        <button
          type="button"
          disabled={rows.length < limit || loading}
          onClick={() => setOffset((o) => o + limit)}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
        >
          Trang sau
        </button>
      </div>

      <Panel title="Danh sách" noDivider padding={false} className="overflow-hidden">
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
              {rows.map((r) => (
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
    </div>
  )
}
