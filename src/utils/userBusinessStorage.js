/** Lưu nghiệp vụ phía học viên theo email (localStorage) */

const PREFIX = 'levelup-biz-'

export function bizKey(email) {
  const safe = String(email || 'guest')
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '_')
  return `${PREFIX}${safe}`
}

export function getTestResults(email) {
  try {
    const raw = localStorage.getItem(`${bizKey(email)}-tests`)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/**
 * @param {string} email
 * @param {{ examId: number, title: string, score: number, maxScore: number, correct: number, total: number }} record
 */
export function appendTestResult(email, record) {
  try {
    const list = getTestResults(email)
    list.unshift({
      ...record,
      at: new Date().toISOString(),
    })
    localStorage.setItem(`${bizKey(email)}-tests`, JSON.stringify(list.slice(0, 40)))
  } catch {
    /* ignore */
  }
}

export function getCourseProgressMap(email) {
  try {
    const raw = localStorage.getItem(`${bizKey(email)}-courses`)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * @param {string} email
 * @param {string} courseKey
 * @param {{ progress: number, note?: string }} data
 */
export function setCourseProgress(email, courseKey, data) {
  try {
    const map = getCourseProgressMap(email)
    map[courseKey] = {
      ...map[courseKey],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(`${bizKey(email)}-courses`, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}
