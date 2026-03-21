/** Mock dữ liệu cho trang Admin & Giáo viên — offline, không gọi API */

export const adminStats = {
  totalStudents: 1284,
  totalTeachers: 24,
  activeCourses: 18,
  monthlyRevenue: 245000000,
  pendingAdmissions: 42,
  openTickets: 7,
}

export const adminActivity = [
  { id: 1, time: '10:32', user: 'admin@levelup.edu', action: 'Cập nhật khóa học Toán 12', type: 'course' },
  { id: 2, time: '09:15', user: 'system', action: 'Sao lưu cơ sở dữ liệu tự động', type: 'system' },
  { id: 3, time: 'Hôm qua', user: 'admin@levelup.edu', action: 'Duyệt tài khoản giáo viên mới', type: 'user' },
  { id: 4, time: 'Hôm qua', user: 'support@levelup.edu', action: 'Trả lời ticket #882', type: 'support' },
]

export type MockStudent = {
  id: string
  name: string
  email: string
  grade: string
  status: 'active' | 'inactive' | 'trial'
  joined: string
}

export const mockStudents: MockStudent[] = [
  { id: 'HV001', name: 'Nguyễn Văn A', email: 'nva@email.com', grade: 'Lớp 10', status: 'active', joined: '12/01/2025' },
  { id: 'HV002', name: 'Trần Thị B', email: 'ttb@email.com', grade: 'Lớp 11', status: 'trial', joined: '15/02/2025' },
  { id: 'HV003', name: 'Lê Văn C', email: 'lvc@email.com', grade: 'Lớp 12', status: 'active', joined: '03/03/2025' },
  { id: 'HV004', name: 'Phạm Thu D', email: 'ptd@email.com', grade: 'Lớp 9', status: 'inactive', joined: '20/11/2024' },
  { id: 'HV005', name: 'Hoàng Minh E', email: 'hme@email.com', grade: 'Lớp 12', status: 'active', joined: '01/03/2025' },
]

export type MockTeacherRow = {
  id: string
  name: string
  email: string
  subjects: string
  classes: number
  status: 'approved' | 'pending'
}

export const mockTeachersAdmin: MockTeacherRow[] = [
  { id: 'GV001', name: 'Thầy Minh Tuấn', email: 'tuan@levelup.edu', subjects: 'Toán', classes: 5, status: 'approved' },
  { id: 'GV002', name: 'Cô Thanh Hà', email: 'ha@levelup.edu', subjects: 'Toán, Vật lý', classes: 4, status: 'approved' },
  { id: 'GV003', name: 'Thầy Đức Anh', email: 'anh@levelup.edu', subjects: 'Toán', classes: 3, status: 'pending' },
]

export type AdmissionApplication = {
  id: string
  studentName: string
  parentPhone: string
  grade: string
  status: 'new' | 'reviewing' | 'accepted' | 'rejected'
  submitted: string
}

export const mockAdmissions: AdmissionApplication[] = [
  { id: 'TS001', studentName: 'Vũ Khánh', parentPhone: '0901112233', grade: 'Lớp 10', status: 'new', submitted: '18/03/2025' },
  { id: 'TS002', studentName: 'Đặng Linh', parentPhone: '0912223344', grade: 'Lớp 12', status: 'reviewing', submitted: '17/03/2025' },
  { id: 'TS003', studentName: 'Bùi Nam', parentPhone: '0933334455', grade: 'Lớp 11', status: 'accepted', submitted: '10/03/2025' },
]

/** Giáo viên — dữ liệu riêng */
export const teacherStats = {
  myClasses: 4,
  totalStudents: 86,
  pendingGrading: 12,
  upcomingSessions: 6,
}

export type TeacherClass = {
  id: string
  name: string
  subject: string
  grade: string
  students: number
  schedule: string
}

export const mockTeacherClasses: TeacherClass[] = [
  { id: 'LH01', name: 'Toán 12A - Luyện thi', subject: 'Toán', grade: '12', students: 28, schedule: 'T2, T4 19:30' },
  { id: 'LH02', name: 'Toán 10C', subject: 'Toán', grade: '10', students: 32, schedule: 'T3, T6 18:00' },
  { id: 'LH03', name: 'Ôn lớp 11', subject: 'Toán', grade: '11', students: 26, schedule: 'T5 20:00' },
]

export type TeacherLesson = {
  id: string
  title: string
  className: string
  duration: string
  views: number
  updated: string
}

export const mockTeacherLessons: TeacherLesson[] = [
  { id: 'BG101', title: 'Đạo hàm - Bài tập tổng hợp', className: 'Toán 12A', duration: '52 phút', views: 124, updated: '19/03/2025' },
  { id: 'BG102', title: 'Hình học không gian - Lăng trụ', className: 'Toán 12A', duration: '45 phút', views: 98, updated: '17/03/2025' },
  { id: 'BG103', title: 'Phương trình bậc hai', className: 'Toán 10C', duration: '40 phút', views: 210, updated: '15/03/2025' },
]

export type ScheduleSlot = {
  id: string
  day: string
  time: string
  className: string
  room: string
}

export const mockTeacherSchedule: ScheduleSlot[] = [
  { id: 'S1', day: 'Thứ 2', time: '19:30 - 21:00', className: 'Toán 12A', room: 'Online - Zoom 1' },
  { id: 'S2', day: 'Thứ 3', time: '18:00 - 19:30', className: 'Toán 10C', room: 'Online - Zoom 2' },
  { id: 'S3', day: 'Thứ 4', time: '19:30 - 21:00', className: 'Toán 12A', room: 'Online - Zoom 1' },
  { id: 'S4', day: 'Thứ 5', time: '20:00 - 21:30', className: 'Ôn lớp 11', room: 'Online - Zoom 3' },
]

export type AssignmentItem = {
  id: string
  title: string
  className: string
  due: string
  submitted: number
  total: number
}

export const mockTeacherAssignments: AssignmentItem[] = [
  { id: 'BT01', title: 'Bài tập Đạo hàm - Tuần 4', className: 'Toán 12A', due: '23/03/2025', submitted: 22, total: 28 },
  { id: 'BT02', title: 'Kiểm tra 15 phút - Hình học', className: 'Toán 10C', due: '22/03/2025', submitted: 30, total: 32 },
]

export type GradingQueueItem = {
  id: string
  studentName: string
  assignment: string
  submittedAt: string
  score?: number
  status: 'pending' | 'graded'
}

export const mockGradingQueue: GradingQueueItem[] = [
  { id: 'G1', studentName: 'Nguyễn Văn A', assignment: 'BT Đạo hàm', submittedAt: '20/03 21:10', status: 'pending' },
  { id: 'G2', studentName: 'Trần Thị B', assignment: 'BT Đạo hàm', submittedAt: '20/03 19:00', status: 'graded', score: 8.5 },
  { id: 'G3', studentName: 'Lê Văn C', assignment: 'Kiểm tra 15p', submittedAt: '19/03 22:00', status: 'pending' },
]

export type TeacherStudent = {
  id: string
  name: string
  className: string
  progress: number
  lastActive: string
}

export const mockTeacherStudents: TeacherStudent[] = [
  { id: 'HV101', name: 'Nguyễn Văn A', className: 'Toán 12A', progress: 78, lastActive: 'Hôm nay' },
  { id: 'HV102', name: 'Trần Thị B', className: 'Toán 12A', progress: 92, lastActive: 'Hôm qua' },
  { id: 'HV103', name: 'Lê Văn C', className: 'Toán 10C', progress: 65, lastActive: '2 ngày trước' },
]

