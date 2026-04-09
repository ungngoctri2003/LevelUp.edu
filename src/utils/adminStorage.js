/**
 * Hàm thuần cho dashboard — dữ liệu nay lấy từ AdminDataContext / Supabase.
 */
export function computeDashboardStats(s) {
  const activeStudents = s.students.filter(
    (x) => x.status === 'active' || x.status === 'trial',
  ).length
  const approvedTeachers = s.teachers.filter((t) => t.status === 'approved').length
  const activeCourses = s.courses.filter((c) => c.visible !== false).length
  return {
    totalStudents: activeStudents,
    totalTeachers: approvedTeachers,
    activeCourses,
    monthlyRevenue: s.settings?.monthlyRevenue ?? 0,
    openTickets: s.settings?.openTickets ?? 0,
  }
}
