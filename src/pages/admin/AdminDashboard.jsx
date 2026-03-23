import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity, computeDashboardStats, resetAdminToDefaults } from '../../utils/adminStorage'

const quickLinks = [
  { to: '/admin/hoc-vien', label: 'Học viên', desc: 'Tìm kiếm, trạng thái tài khoản' },
  { to: '/admin/giao-vien', label: 'Giáo viên', desc: 'Duyệt hồ sơ, phân lớp' },
  { to: '/admin/khoa-hoc', label: 'Khóa học', desc: 'Hiển thị web, chỉnh nội dung' },
  { to: '/admin/tin-tuc', label: 'Tin tức', desc: 'Đăng bài, thông báo' },
  { to: '/admin/bai-kiem-tra', label: 'Bài kiểm tra', desc: 'Đề, giao bài, hiển thị công khai' },
  { to: '/admin/tuyen-sinh', label: 'Tuyển sinh', desc: 'Hồ sơ, trạng thái xét duyệt' },
]

function formatMoney(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}

export default function AdminDashboard() {
  const { state, update } = useAdminState()
  const stats = useMemo(() => computeDashboardStats(state), [state])
  const [revDraft, setRevDraft] = useState('')
  const [tickDraft, setTickDraft] = useState('')

  const applySettings = (e) => {
    e.preventDefault()
    const monthlyRevenue = revDraft === '' ? state.settings.monthlyRevenue : Number(revDraft.replace(/\D/g, '')) || 0
    const openTickets = tickDraft === '' ? state.settings.openTickets : Math.max(0, parseInt(tickDraft, 10) || 0)
    update((s) => ({
      ...s,
      settings: { ...s.settings, monthlyRevenue, openTickets },
    }))
    appendAdminActivity('Cập nhật chỉ số tài chính / ticket (tổng quan)')
    setRevDraft('')
    setTickDraft('')
  }

  const handleReset = () => {
    if (!confirm('Xóa toàn bộ dữ liệu quản trị đã lưu và khôi phục về mặc định? Thao tác không thể hoàn tác.')) return
    resetAdminToDefaults()
    appendAdminActivity('Khôi phục dữ liệu mặc định hệ thống')
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Bảng điều khiển"
        title="Tổng quan hệ thống"
        description="Số liệu cập nhật theo dữ liệu bạn chỉnh trong admin — lưu cục bộ trên trình duyệt."
      >
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/20"
        >
          Khôi phục dữ liệu mặc định
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          accent="admin"
          label="Học viên (đang/trial)"
          value={stats.totalStudents.toLocaleString('vi-VN')}
          hint="Không tính tài khoản khóa"
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
        <Panel title="Chỉ số nhanh" subtitle="Chỉnh doanh thu ước và số ticket — dùng cho báo cáo tổng quan.">
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
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/15 transition hover:opacity-95"
            >
              Lưu chỉ số
            </button>
          </div>
        </div>
        </Panel>
      </form>

      <Panel title="Thao tác nhanh" subtitle="Đi tới từng phân hệ quản trị.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group rounded-xl border border-white/10 bg-black/25 px-4 py-4 text-left transition-all hover:border-cyan-400/35 hover:bg-white/[0.06] hover:shadow-md hover:shadow-cyan-500/5"
            >
              <span className="font-semibold text-cyan-200 group-hover:text-cyan-100">{q.label}</span>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{q.desc}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Hoạt động gần đây" subtitle="Nhật ký thao tác gần nhất trên hệ thống.">
        <ul className="space-y-0">
          {(state.activity || []).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 py-3 text-sm first:pt-0 last:border-0 last:pb-0"
            >
              <span className="text-slate-300">{row.action}</span>
              <span className="text-xs text-slate-500">
                {row.time} · {row.user}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
