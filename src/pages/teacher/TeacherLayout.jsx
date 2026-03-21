import DashboardShell from '../../components/dashboard/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'

export const teacherNavItems = [
  { to: '/giao-vien', label: 'Tổng quan', end: true, icon: 'dashboard' },
  { to: '/giao-vien/lop-hoc', label: 'Lớp học', icon: 'class' },
  { to: '/giao-vien/bai-giang', label: 'Bài giảng', icon: 'lesson' },
  { to: '/giao-vien/lich', label: 'Lịch dạy', icon: 'calendar' },
  { to: '/giao-vien/bai-tap', label: 'Bài tập & kiểm tra', icon: 'assignment' },
  { to: '/giao-vien/cham-diem', label: 'Chấm điểm', icon: 'grading' },
  { to: '/giao-vien/hoc-sinh', label: 'Học sinh', icon: 'users' },
]

export default function TeacherLayout() {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <DashboardShell navItems={teacherNavItems} title="Khu vực giáo viên" accent="teacher" />
    </ProtectedRoute>
  )
}
