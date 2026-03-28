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
