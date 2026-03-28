/**
 * Hàm thuần cho dashboard — dữ liệu nay lấy từ AdminDataContext / Supabase.
 */
export function computeDashboardStats(s) {
  const activeStudents = s.students.filter(
    (x) => x.status === 'active' || x.status === 'trial',
  ).length
  const approvedTeachers = s.teachers.filter((t) => t.status === 'approved').length
  const activeCourses = s.courses.filter((c) => c.visible !== false).length
  const pendingAdmissions = s.admissions.filter((a) => a.status === 'new' || a.status === 'reviewing').length
  return {
    totalStudents: activeStudents,
    totalTeachers: approvedTeachers,
    activeCourses,
    monthlyRevenue: s.settings?.monthlyRevenue ?? 0,
    pendingAdmissions,
    openTickets: s.settings?.openTickets ?? 0,
  }
}
