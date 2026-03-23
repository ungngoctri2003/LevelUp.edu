/** Nghiệp vụ học viên & danh sách lớp — đồng bộ với khu giáo viên / admin (lưu cục bộ) */

export type EnrolledCourse = {
  key: string
  title: string
  teacher: string
  defaultProgress: number
  nextLesson: string
  totalLessons: number
}

export const studentEnrolledCourses: EnrolledCourse[] = [
  {
    key: 'toan-12-luyen',
    title: 'Toán 12 - Luyện thi THPT',
    teacher: 'Thầy Minh Tuấn',
    defaultProgress: 38,
    nextLesson: 'Đạo hàm — Bài tập tổng hợp',
    totalLessons: 48,
  },
  {
    key: 'vat-ly-thpt',
    title: 'Vật lý THPT — Điện & sóng',
    teacher: 'Cô Thanh Hà',
    defaultProgress: 44,
    nextLesson: 'Dao động cơ — Bài tập chương 1',
    totalLessons: 36,
  },
  {
    key: 'tieng-anh-12',
    title: 'Tiếng Anh — Reading & Writing',
    teacher: 'Thầy Đức Anh',
    defaultProgress: 52,
    nextLesson: 'Unit 5 — Reading comprehension',
    totalLessons: 40,
  },
]

export type RosterStudent = {
  id: string
  name: string
  email: string
  avgScore: number
  attendance: string
}

/** Danh sách học sinh theo mã lớp (LH01, LH02, LH03) — dùng cho giáo viên */
export const teacherClassRosters: Record<string, RosterStudent[]> = {
  LH01: [
    { id: 'HV101', name: 'Nguyễn Văn A', email: 'nva@email.com', avgScore: 8.2, attendance: '95%' },
    { id: 'HV102', name: 'Trần Thị B', email: 'ttb@email.com', avgScore: 7.5, attendance: '88%' },
    { id: 'HV103', name: 'Lê Văn C', email: 'lvc@email.com', avgScore: 6.8, attendance: '92%' },
  ],
  LH02: [
    { id: 'HV201', name: 'Phạm Thu D', email: 'ptd@email.com', avgScore: 7.9, attendance: '90%' },
    { id: 'HV202', name: 'Hoàng Minh E', email: 'hme@email.com', avgScore: 8.5, attendance: '96%' },
  ],
  LH03: [
    { id: 'HV301', name: 'Vũ Khánh', email: 'vk@email.com', avgScore: 7.2, attendance: '85%' },
    { id: 'HV302', name: 'Đặng Linh', email: 'dl@email.com', avgScore: 8.0, attendance: '91%' },
  ],
}
