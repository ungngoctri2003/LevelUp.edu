/** Chuẩn hóa tên môn để so khớp khóa ↔ lớp ↔ thanh toán */
export function normSubject(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

/**
 * Quyền xem đầy đủ khóa (catalog): admin/teacher luôn mở;
 * học viên mở khi: đã thanh toán khóa (paid) HOẶC đã ghi danh lớp cùng môn HOẶC đã thanh toán lớp (paid) cùng môn.
 */
export function userHasCourseAccess(course, { profile, myClasses, myPayments, myCoursePayments, saleClasses }) {
  if (!course) return false
  if (profile?.role === 'admin' || profile?.role === 'teacher') return true
  if (profile?.role !== 'student') return false

  const cid = Number(course.courseId)
  if (
    myCoursePayments?.some((p) => Number(p.course_id) === cid && p.payment_status === 'paid')
  ) {
    return true
  }

  const key = normSubject(course.subjectName)
  if (myClasses?.some((r) => normSubject(r.subject) === key)) return true

  const sale = saleClasses?.find((s) => normSubject(s.subject) === key)
  if (!sale) return false

  return Boolean(
    myPayments?.some(
      (p) => Number(p.class_id) === Number(sale.id) && p.payment_status === 'paid',
    ),
  )
}
