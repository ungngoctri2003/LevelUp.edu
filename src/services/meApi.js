import { apiFetch, authHeaders } from '../lib/api.js'

function meFetch(accessToken, path, init = {}) {
  if (!accessToken) throw new Error('Chưa đăng nhập')
  const headers = { ...authHeaders(accessToken), ...init.headers }
  return apiFetch(path, { ...init, headers })
}

/** @returns {Promise<{ data: object[] }>} */
export async function getMyExamAttempts(accessToken, limit = 80) {
  const q = new URLSearchParams({ limit: String(Math.min(200, Math.max(1, limit))) })
  return meFetch(accessToken, `/api/me/exam-attempts?${q}`)
}

export async function postMyExamAttempt(accessToken, body) {
  return meFetch(accessToken, '/api/me/exam-attempts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** Đề được giao — chỉ học viên đã ghi danh lớp (kèm meta.needsEnrollment nếu chưa có lớp).
 *  @param {{ classId?: number|string }} [opts] — khi có `classId`, chỉ đề gán cho lớp đó (exam_class_assignments).
 */
export async function getMyAssignedExams(accessToken, opts = {}) {
  const q = new URLSearchParams()
  const cid = opts.classId != null ? Number(opts.classId) : NaN
  if (Number.isFinite(cid)) q.set('class_id', String(cid))
  const qs = q.toString()
  return meFetch(accessToken, `/api/me/exams${qs ? `?${qs}` : ''}`)
}

/** Chi tiết đề để làm bài (cùng điều kiện truy cập) */
export async function getMyAssignedExamById(accessToken, examId) {
  return meFetch(accessToken, `/api/me/exams/${Number(examId)}`)
}

export async function getMyClasses(accessToken) {
  return meFetch(accessToken, '/api/me/classes')
}

export async function getMyPayments(accessToken) {
  return meFetch(accessToken, '/api/me/payments')
}

export async function postMyPayment(accessToken, body) {
  return meFetch(accessToken, '/api/me/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getMyCoursePayments(accessToken) {
  return meFetch(accessToken, '/api/me/course-payments')
}

export async function postMyCoursePayment(accessToken, body) {
  return meFetch(accessToken, '/api/me/course-payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getMyCourseProgress(accessToken) {
  return meFetch(accessToken, '/api/me/course-progress')
}

export async function patchMyCourseProgress(accessToken, courseId, body) {
  return meFetch(accessToken, `/api/me/course-progress/${Number(courseId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function getMyAssignments(accessToken) {
  return meFetch(accessToken, '/api/me/assignments')
}

export async function getMyAssignmentSubmissions(accessToken) {
  return meFetch(accessToken, '/api/me/assignment-submissions')
}

export async function postMyAssignmentSubmission(accessToken, body) {
  return meFetch(accessToken, '/api/me/assignment-submissions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** Bài giảng đăng trong lớp (teacher_lesson_posts) — chỉ học viên, RLS theo ghi danh */
export async function getMyClassLessonPosts(accessToken) {
  return meFetch(accessToken, '/api/me/class-lesson-posts')
}

/** Chi tiết một bài giảng lớp (có nội dung body) */
export async function getMyClassLessonPost(accessToken, postId) {
  const id = Number(postId)
  if (!Number.isFinite(id)) throw new Error('ID bài giảng không hợp lệ')
  return meFetch(accessToken, `/api/me/class-lesson-posts/${id}`)
}

/** Lịch buổi học các lớp đã ghi danh */
export async function getMyClassSchedule(accessToken) {
  return meFetch(accessToken, '/api/me/class-schedule')
}
