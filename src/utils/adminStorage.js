/**
 * Trạng thái quản trị offline — lưu localStorage, đồng bộ với trang công khai.
 */
import { mockStudents, mockTeachersAdmin, mockAdmissions, adminActivity } from '../data/dashboardData'
import { courses as defaultCourses, exams as defaultExams, news as defaultNews } from '../data'
import { getTestResults } from './userBusinessStorage'

export const ADMIN_STORAGE_KEY = 'levelup-admin-v1'

let listeners = new Set()

function notify() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

export function subscribeAdmin(callback) {
  listeners.add(callback)
  const onStorage = (e) => {
    if (e.key === ADMIN_STORAGE_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}

export function getDefaultAdminState() {
  return {
    students: mockStudents.map((s) => ({ ...s })),
    teachers: mockTeachersAdmin.map((t) => ({ ...t })),
    courses: defaultCourses.map((c) => ({ ...c, visible: true })),
    exams: defaultExams.map((e) => ({ ...e, published: true })),
    news: defaultNews.map((n) => ({ ...n })),
    admissions: mockAdmissions.map((a) => ({ ...a })),
    activity: adminActivity.map((a) => ({ ...a })),
    settings: {
      monthlyRevenue: 245000000,
      openTickets: 7,
    },
  }
}

function normalizeState(raw) {
  const d = getDefaultAdminState()
  if (!raw || typeof raw !== 'object') return d
  return {
    students: Array.isArray(raw.students) ? raw.students : d.students,
    teachers: Array.isArray(raw.teachers) ? raw.teachers : d.teachers,
    courses: Array.isArray(raw.courses) ? raw.courses : d.courses,
    exams: Array.isArray(raw.exams)
      ? raw.exams.map((e) => ({ ...e, published: e.published !== false }))
      : d.exams,
    news: Array.isArray(raw.news) ? raw.news : d.news,
    admissions: Array.isArray(raw.admissions) ? raw.admissions : d.admissions,
    activity: Array.isArray(raw.activity) ? raw.activity : d.activity,
    settings:
      raw.settings && typeof raw.settings === 'object'
        ? { ...d.settings, ...raw.settings }
        : d.settings,
  }
}

export function loadAdminState() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (!raw) return getDefaultAdminState()
    return normalizeState(JSON.parse(raw))
  } catch {
    return getDefaultAdminState()
  }
}

export function saveAdminState(next) {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(next))
    notify()
  } catch {
    /* ignore */
  }
}

/** Cập nhật một phần state (functional hoặc object merge nông). */
export function patchAdminState(updater) {
  const prev = loadAdminState()
  const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
  saveAdminState(next)
  return next
}

let activityId = 1000
export function appendAdminActivity(action, user = 'admin@levelup.edu') {
  patchAdminState((s) => {
    activityId += 1
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const row = {
      id: activityId,
      time,
      user,
      action,
      type: 'admin',
    }
    return {
      ...s,
      activity: [row, ...(s.activity || []).slice(0, 19)],
    }
  })
}

/**
 * Gọi khi học viên đăng ký — thêm vào danh sách quản trị (nếu chưa có).
 */
export function registerStudentFromSignup({ email, name, phone, role }) {
  if (role !== 'user' || !email) return
  const em = String(email).toLowerCase().trim()
  patchAdminState((s) => {
    if (s.students.some((x) => String(x.email).toLowerCase() === em)) return s
    activityId += 1
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const activityRow = {
      id: activityId,
      time,
      user: 'system',
      action: `Đăng ký học viên mới: ${email}`,
      type: 'admin',
    }
    const id = `HV${Date.now().toString(36).toUpperCase().slice(-6)}`
    const student = {
      id,
      name: name || em.split('@')[0],
      email: email.trim(),
      phone: phone || '',
      grade: '—',
      status: 'active',
      joined: new Date().toLocaleDateString('vi-VN'),
      source: 'registered',
    }
    return {
      ...s,
      students: [student, ...s.students],
      activity: [activityRow, ...(s.activity || []).slice(0, 19)],
    }
  })
}

/** Khôi phục dữ liệu mẫu (dùng trong admin). */
export function resetAdminToDefaults() {
  const d = getDefaultAdminState()
  saveAdminState(d)
  return d
}

/** --- Trang công khai --- */

export function getPublicCourses() {
  const { courses } = loadAdminState()
  return courses.filter((c) => c.visible !== false)
}

export function getPublicNews() {
  const { news } = loadAdminState()
  return [...news].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
}

export function getPublicExams() {
  const { exams } = loadAdminState()
  return exams.filter((e) => e.published !== false)
}

/** Thống kê dashboard admin (động). */
export function computeDashboardStats(s) {
  const activeStudents = s.students.filter((x) => x.status === 'active' || x.status === 'trial').length
  const approvedTeachers = s.teachers.filter((t) => t.status === 'approved').length
  const activeCourses = s.courses.filter((c) => c.visible !== false).length
  const pendingAdmissions = s.admissions.filter((a) => a.status === 'new' || a.status === 'reviewing').length
  return {
    totalStudents: activeStudents,
    totalTeachers: approvedTeachers,
    activeCourses,
    monthlyRevenue: s.settings?.monthlyRevenue ?? 245000000,
    pendingAdmissions,
    openTickets: s.settings?.openTickets ?? 7,
  }
}

export function getAdminDashboardStats() {
  return computeDashboardStats(loadAdminState())
}

/** Số bài kiểm tra đã làm (theo email) — hiển thị cột admin. */
export function getStudentTestCount(email) {
  if (!email) return 0
  return getTestResults(email).length
}
