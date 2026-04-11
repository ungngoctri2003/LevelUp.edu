import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import AdminRevenueChart from '../../components/admin/AdminRevenueChart'
import { useAdminState } from '../../hooks/useAdminState'
import { computeDashboardStats } from '../../utils/adminStorage'

const quickLinks = [
  { to: '/admin/hoc-vien', label: 'Học viên', desc: 'Tìm kiếm, trạng thái tài khoản' },
  { to: '/admin/giao-vien', label: 'Giáo viên', desc: 'Duyệt hồ sơ, phân lớp' },
  { to: '/admin/thanh-toan', label: 'Thanh toán', desc: 'Xác nhận giao dịch và ghi danh lớp' },
  { to: '/admin/khoa-hoc', label: 'Khóa học & môn', desc: 'Danh mục môn, khóa hiển thị web' },
  { to: '/admin/bai-giang-noi-dung', label: 'Bài giảng', desc: 'Trực tuyến + bài trong lớp' },
  { to: '/admin/doi-ngu-trang-chu', label: 'Đội ngũ landing', desc: 'Thẻ giáo viên trang chủ' },
  { to: '/admin/tin-tuc', label: 'Tin tức', desc: 'Đăng bài, thông báo' },
  { to: '/admin/bai-kiem-tra', label: 'Bài kiểm tra', desc: 'Đề, giao bài, hiển thị công khai' },
]

export default function AdminDashboard() {
  const { state, loading, error, refresh } = useAdminState()
  const stats = useMemo(() => computeDashboardStats(state), [state])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

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
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Tải lại dữ liệu
        </button>
      </PageHeader>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          accent="admin"
          label="Học viên đang học / học thử"
          value={stats.totalStudents.toLocaleString('vi-VN')}
          hint="Đếm theo trạng thái học tập"
        />
        <StatCard accent="admin" label="Giáo viên đã duyệt" value={String(stats.totalTeachers)} />
        <StatCard accent="admin" label="Khóa học hiển thị web" value={String(stats.activeCourses)} />
      </div>

      {!loading && <AdminRevenueChart payments={state.payments || []} />}

      <Panel title="Hoạt động gần đây" subtitle="Nhật ký thao tác gần nhất">
        <ul className="divide-y divide-gray-200 text-sm text-slate-700 dark:divide-white/5 dark:text-slate-300">
          {(state.activity || []).slice(0, 12).map((a) => (
            <li key={a.id} className="flex flex-wrap gap-2 py-3">
              <span className="text-slate-500">{a.time}</span>
              <span className="text-cyan-700 dark:text-cyan-200/90">{a.user}</span>
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
              className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-cyan-400/50 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-cyan-500/30 dark:hover:bg-white/[0.07]"
            >
              <div className="font-medium text-gray-900 dark:text-white">{l.label}</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{l.desc}</p>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  )
}
