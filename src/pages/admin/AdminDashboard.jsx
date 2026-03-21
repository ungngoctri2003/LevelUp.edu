import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
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
    if (!confirm('Xóa toàn bộ dữ liệu quản trị đã lưu và khôi phục bản mẫu? Thao tác không thể hoàn tác.')) return
    resetAdminToDefaults()
    appendAdminActivity('Khôi phục dữ liệu mẫu hệ thống')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Tổng quan hệ thống</h2>
          <p className="mt-1 text-sm text-slate-400">
            Số liệu cập nhật theo dữ liệu bạn chỉnh trong admin — lưu trên trình duyệt.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="shrink-0 rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
        >
          Khôi phục dữ liệu mẫu
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Học viên (đang/trial)" value={stats.totalStudents.toLocaleString('vi-VN')} hint="Không tính tài khoản khóa" />
        <StatCard label="Giáo viên đã duyệt" value={String(stats.totalTeachers)} />
        <StatCard label="Khóa hiển thị web" value={String(stats.activeCourses)} />
        <StatCard label="Doanh thu tháng (ước)" value={formatMoney(stats.monthlyRevenue)} />
        <StatCard label="Hồ sơ tuyển sinh chờ" value={String(stats.pendingAdmissions)} hint="Trạng thái mới hoặc đang xét" />
        <StatCard label="Ticket hỗ trợ mở" value={String(stats.openTickets)} />
      </div>

      <form
        onSubmit={applySettings}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
      >
        <h3 className="text-lg font-semibold text-white">Chỉ số nhanh (demo)</h3>
        <p className="mt-1 text-sm text-slate-500">Chỉnh doanh thu ước và số ticket — dùng cho báo cáo tổng quan.</p>
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
              className="rounded-xl bg-cyan-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600"
            >
              Lưu chỉ số
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">Thao tác nhanh</h3>
        <p className="mt-1 text-sm text-slate-500">Đi tới từng phân hệ quản trị.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition-colors hover:border-cyan-500/40 hover:bg-white/5"
            >
              <span className="font-medium text-cyan-200">{q.label}</span>
              <p className="mt-0.5 text-xs text-slate-500">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
        <ul className="mt-4 space-y-3">
          {(state.activity || []).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0"
            >
              <span className="text-slate-300">{row.action}</span>
              <span className="text-xs text-slate-500">
                {row.time} · {row.user}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
