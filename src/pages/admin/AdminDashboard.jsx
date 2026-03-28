import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAdminState } from '../../hooks/useAdminState'
import { computeDashboardStats } from '../../utils/adminStorage'

const quickLinks = [
  { to: '/admin/hoc-vien', label: 'Học viên', desc: 'Tìm kiếm, trạng thái tài khoản' },
  { to: '/admin/giao-vien', label: 'Giáo viên', desc: 'Duyệt hồ sơ, phân lớp' },
  { to: '/admin/khoa-hoc', label: 'Khóa học', desc: 'Hiển thị web, chỉnh nội dung' },
  { to: '/admin/tin-tuc', label: 'Tin tức', desc: 'Đăng bài, thông báo' },
  { to: '/admin/bai-kiem-tra', label: 'Bài kiểm tra', desc: 'Đề, giao bài, hiển thị công khai' },
  { to: '/admin/tuyen-sinh', label: 'Tuyển sinh', desc: 'Hồ sơ, trạng thái xét duyệt' },
]

function formatMoney(n) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function AdminDashboard() {
  const { state, loading, error, refresh, saveDashboardSettings } = useAdminState()
  const stats = useMemo(() => computeDashboardStats(state), [state])
  const [revDraft, setRevDraft] = useState('')
  const [tickDraft, setTickDraft] = useState('')

  const applySettings = async (e) => {
    e.preventDefault()
    const monthlyRevenue =
      revDraft === '' ? state.settings.monthlyRevenue : Number(revDraft.replace(/\D/g, '')) || 0
    const openTickets =
      tickDraft === '' ? state.settings.openTickets : Math.max(0, parseInt(tickDraft, 10) || 0)
    try {
      await saveDashboardSettings({ monthlyRevenue, openTickets })
      setRevDraft('')
      setTickDraft('')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Bảng điều khiển"
        title="Tổng quan hệ thống"
        description="Tổng hợp nhanh số liệu vận hành và lối tắt tới các mục quản trị."
      >
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
        >
          Tải lại dữ liệu
        </button>
      </PageHeader>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          accent="admin"
          label="Học viên đang học / học thử"
          value={stats.totalStudents.toLocaleString('vi-VN')}
          hint="Đếm theo trạng thái học tập"
        />
        <StatCard accent="admin" label="Giáo viên đã duyệt" value={String(stats.totalTeachers)} />
        <StatCard accent="admin" label="Khóa hiển thị web" value={String(stats.activeCourses)} />
        <StatCard accent="admin" label="Doanh thu tháng (ước)" value={formatMoney(stats.monthlyRevenue)} />
        <StatCard
          accent="admin"
          label="Hồ sơ tuyển sinh chờ"
          value={String(stats.pendingAdmissions)}
          hint="Trạng thái mới hoặc đang xét"
        />
        <StatCard accent="admin" label="Ticket hỗ trợ mở" value={String(stats.openTickets)} />
      </div>

      <form onSubmit={applySettings} className="space-y-0">
        <Panel title="Chỉ số nhanh" subtitle="Các con số ước tính hiển thị trên tổng quan (lưu cùng hệ thống).">
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Doanh thu tháng (VND)</span>
              <input
                name="revenue"
                placeholder={String(state.settings?.monthlyRevenue ?? '')}
                value={revDraft}
                onChange={(e) => setRevDraft(e.target.value)}
                className="w-48 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Ticket mở</span>
              <input
                name="tickets"
                type="number"
                min={0}
                placeholder={String(state.settings?.openTickets ?? '')}
                value={tickDraft}
                onChange={(e) => setTickDraft(e.target.value)}
                className="w-32 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white"
              >
                Lưu chỉ số
              </button>
            </div>
          </div>
        </Panel>
      </form>

      <Panel title="Hoạt động gần đây" subtitle="Nhật ký thao tác gần nhất">
        <ul className="divide-y divide-white/5 text-sm text-slate-300">
          {(state.activity || []).slice(0, 12).map((a) => (
            <li key={a.id} className="flex flex-wrap gap-2 py-3">
              <span className="text-slate-500">{a.time}</span>
              <span className="text-cyan-200/90">{a.user}</span>
              <span>{a.action}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Điều hướng nhanh" subtitle="Các module quản trị">
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {quickLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-500/30 hover:bg-white/[0.07]"
            >
              <div className="font-medium text-white">{l.label}</div>
              <p className="mt-1 text-xs text-slate-400">{l.desc}</p>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  )
}
