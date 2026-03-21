/**
 * Tài khoản demo — chỉ dùng để thử giao diện (không có server xác thực).
 * Mật khẩu hiển thị trong UI; bất kỳ mật khẩu nào cũng được chấp nhận nếu điền đủ trường.
 */
export const DEMO_PASSWORD = 'demo123'

export const demoLoginAccounts = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Quản trị hệ thống',
    name: 'Admin Demo',
    email: 'admin@demo.levelup.edu',
    password: DEMO_PASSWORD,
    role: 'admin' as const,
  },
  {
    id: 'teacher',
    label: 'Giáo viên',
    description: 'Khu /giao-vien',
    name: 'Giáo viên Demo',
    email: 'giaovien@demo.levelup.edu',
    password: DEMO_PASSWORD,
    role: 'teacher' as const,
  },
  {
    id: 'student',
    label: 'Học viên',
    description: 'Trang chủ',
    name: 'Học viên Demo',
    email: 'hocvien@demo.levelup.edu',
    password: DEMO_PASSWORD,
    role: 'user' as const,
  },
]
