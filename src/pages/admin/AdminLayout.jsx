import DashboardShell from '../../components/dashboard/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'
import { AdminDataProvider } from '../../context/AdminDataContext.jsx'

export const adminNavItems = [
  { to: '/admin', label: 'Tổng quan', end: true, icon: 'dashboard' },
  { to: '/admin/hoc-vien', label: 'Học viên', icon: 'users' },
  { to: '/admin/giao-vien', label: 'Giáo viên', icon: 'teacher' },
  { to: '/admin/khoa-hoc', label: 'Khóa học', icon: 'book' },
  { to: '/admin/tin-tuc', label: 'Tin tức', icon: 'news' },
  { to: '/admin/bai-kiem-tra', label: 'Bài kiểm tra', icon: 'exam' },
  { to: '/admin/tuyen-sinh', label: 'Tuyển sinh', icon: 'admission' },
]

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDataProvider>
        <DashboardShell navItems={adminNavItems} title="Khu vực quản trị" accent="admin" />
      </AdminDataProvider>
    </ProtectedRoute>
  )
}
