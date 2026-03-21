import DashboardShell from '../../components/dashboard/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'

export const adminNavItems = [
  { to: '/admin', label: 'Tổng quan', end: true },
  { to: '/admin/hoc-vien', label: 'Học viên' },
  { to: '/admin/giao-vien', label: 'Giáo viên' },
  { to: '/admin/khoa-hoc', label: 'Khóa học' },
  { to: '/admin/tin-tuc', label: 'Tin tức' },
  { to: '/admin/bai-kiem-tra', label: 'Bài kiểm tra' },
  { to: '/admin/tuyen-sinh', label: 'Tuyển sinh' },
]

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardShell navItems={adminNavItems} title="Khu vực quản trị" accent="admin" />
    </ProtectedRoute>
  )
}
