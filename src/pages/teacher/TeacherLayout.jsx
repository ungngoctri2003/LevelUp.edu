import DashboardShell from '../../components/dashboard/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'

export const teacherNavItems = [
  { to: '/giao-vien', label: 'Tổng quan', end: true },
  { to: '/giao-vien/lop-hoc', label: 'Lớp học' },
  { to: '/giao-vien/bai-giang', label: 'Bài giảng' },
  { to: '/giao-vien/lich', label: 'Lịch dạy' },
  { to: '/giao-vien/bai-tap', label: 'Bài tập & kiểm tra' },
  { to: '/giao-vien/cham-diem', label: 'Chấm điểm' },
  { to: '/giao-vien/hoc-sinh', label: 'Học sinh' },
]

export default function TeacherLayout() {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <DashboardShell navItems={teacherNavItems} title="Khu vực giáo viên" accent="teacher" />
    </ProtectedRoute>
  )
}
