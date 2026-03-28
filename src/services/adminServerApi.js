import { apiFetch, authHeaders } from '../lib/api.js'

/** Danh sách học viên (service role trên server). */
export function adminListStudents(accessToken) {
  return adminFetch(accessToken, '/api/admin/students')
}

/** Danh sách giáo viên (service role trên server). */
export function adminListTeachers(accessToken) {
  return adminFetch(accessToken, '/api/admin/teachers')
}

/** Map student_id → số lần làm bài thi. */
export function adminListExamAttemptCounts(accessToken) {
  return adminFetch(accessToken, '/api/admin/exam-attempt-counts')
}

function adminFetch(accessToken, path, init = {}) {
  if (!accessToken) {
    throw new Error('Chưa đăng nhập — không có access token. Hãy đăng xuất và đăng nhập lại.')
  }
  return apiFetch(path, {
    ...init,
    headers: { ...authHeaders(accessToken), ...init.headers },
  })
}

/** @param {string} accessToken */
export function adminCreateCourse(accessToken, body) {
  return adminFetch(accessToken, '/api/admin/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function adminPatchCourse(accessToken, id, patch) {
  return adminFetch(accessToken, `/api/admin/courses/${Number(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function adminDeleteCourseApi(accessToken, id, title) {
  const q = title ? `?title=${encodeURIComponent(title)}` : ''
  return adminFetch(accessToken, `/api/admin/courses/${Number(id)}${q}`, { method: 'DELETE' })
}

export function adminCreateExam(accessToken, row) {
  return adminFetch(accessToken, '/api/admin/exams', {
    method: 'POST',
    body: JSON.stringify(row),
  })
}

export function adminPatchExam(accessToken, id, row) {
  return adminFetch(accessToken, `/api/admin/exams/${Number(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(row),
  })
}

export function adminDeleteExamApi(accessToken, id, title) {
  const q = title ? `?title=${encodeURIComponent(title)}` : ''
  return adminFetch(accessToken, `/api/admin/exams/${Number(id)}${q}`, { method: 'DELETE' })
}

export function adminCreateNews(accessToken, row) {
  return adminFetch(accessToken, '/api/admin/news', {
    method: 'POST',
    body: JSON.stringify(row),
  })
}

export function adminPatchNews(accessToken, id, row) {
  return adminFetch(accessToken, `/api/admin/news/${Number(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(row),
  })
}

export function adminDeleteNewsApi(accessToken, id, title) {
  const q = title ? `?title=${encodeURIComponent(title)}` : ''
  return adminFetch(accessToken, `/api/admin/news/${Number(id)}${q}`, { method: 'DELETE' })
}

export function adminCreateAdmission(accessToken, row) {
  return adminFetch(accessToken, '/api/admin/admissions', {
    method: 'POST',
    body: JSON.stringify(row),
  })
}

export function adminPatchAdmissionStatus(accessToken, id, status) {
  return adminFetch(accessToken, `/api/admin/admissions/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function adminDeleteAdmissionApi(accessToken, id) {
  return adminFetch(accessToken, `/api/admin/admissions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function adminPatchStudent(accessToken, profileId, row) {
  return adminFetch(accessToken, `/api/admin/students/${encodeURIComponent(profileId)}`, {
    method: 'PATCH',
    body: JSON.stringify(row),
  })
}

export function adminPostStudentToggleLearning(accessToken, profileId, makeLearningActive) {
  return adminFetch(accessToken, `/api/admin/students/${encodeURIComponent(profileId)}/toggle-learning`, {
    method: 'POST',
    body: JSON.stringify({ makeLearningActive }),
  })
}

export function adminPostStudentAccount(accessToken, profileId, accountStatus) {
  return adminFetch(accessToken, `/api/admin/students/${encodeURIComponent(profileId)}/account`, {
    method: 'POST',
    body: JSON.stringify({ accountStatus }),
  })
}

export function adminPostStudentProfileStatus(accessToken, profileId, status) {
  return adminFetch(accessToken, `/api/admin/students/${encodeURIComponent(profileId)}/student-profile-status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export function adminPatchTeacher(accessToken, profileId, row) {
  return adminFetch(accessToken, `/api/admin/teachers/${encodeURIComponent(profileId)}`, {
    method: 'PATCH',
    body: JSON.stringify(row),
  })
}

export function adminPostTeacherApproval(accessToken, profileId, approvalStatus) {
  return adminFetch(accessToken, `/api/admin/teachers/${encodeURIComponent(profileId)}/approval`, {
    method: 'POST',
    body: JSON.stringify({ approvalStatus }),
  })
}

export function adminPatchDashboardSettings(accessToken, partial) {
  return adminFetch(accessToken, '/api/admin/settings/dashboard', {
    method: 'PATCH',
    body: JSON.stringify(partial),
  })
}

export function adminPostActivity(accessToken, action, type = 'admin') {
  return adminFetch(accessToken, '/api/admin/activity', {
    method: 'POST',
    body: JSON.stringify({ action, type }),
  })
}
