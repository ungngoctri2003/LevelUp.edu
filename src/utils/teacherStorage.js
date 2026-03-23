/**
 * Dữ liệu khu giáo viên — localStorage (CRUD offline).
 */
import {
  initialTeacherClasses,
  initialTeacherLessons,
  initialTeacherSchedule,
  initialTeacherAssignments,
  initialGradingQueue,
  initialTeacherStudents,
} from '../data/dashboardData'
import { teacherClassRosters } from '../data/studentBusinessData'

export const TEACHER_STORAGE_KEY = 'levelup-teacher-v1'

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

export function subscribeTeacher(callback) {
  listeners.add(callback)
  const onStorage = (e) => {
    if (e.key === TEACHER_STORAGE_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}

function cloneRosters() {
  const out = {}
  for (const k of Object.keys(teacherClassRosters)) {
    out[k] = teacherClassRosters[k].map((r) => ({ ...r }))
  }
  return out
}

export function getDefaultTeacherState() {
  return {
    classes: initialTeacherClasses.map((c) => ({ ...c })),
    lessons: initialTeacherLessons.map((l) => ({ ...l })),
    schedule: initialTeacherSchedule.map((s) => ({ ...s })),
    assignments: initialTeacherAssignments.map((a) => ({ ...a })),
    gradingQueue: initialGradingQueue.map((g) => ({ ...g })),
    teacherStudents: initialTeacherStudents.map((s) => ({ ...s })),
    rosters: cloneRosters(),
  }
}

function normalizeState(raw) {
  const d = getDefaultTeacherState()
  if (!raw || typeof raw !== 'object') return d
  const rosters =
    raw.rosters && typeof raw.rosters === 'object'
      ? { ...d.rosters, ...raw.rosters }
      : d.rosters
  for (const cid of Object.keys(d.rosters)) {
    if (!Array.isArray(rosters[cid])) rosters[cid] = d.rosters[cid]
  }
  return {
    classes: Array.isArray(raw.classes) ? raw.classes : d.classes,
    lessons: Array.isArray(raw.lessons) ? raw.lessons : d.lessons,
    schedule: Array.isArray(raw.schedule) ? raw.schedule : d.schedule,
    assignments: Array.isArray(raw.assignments) ? raw.assignments : d.assignments,
    gradingQueue: Array.isArray(raw.gradingQueue) ? raw.gradingQueue : d.gradingQueue,
    teacherStudents: Array.isArray(raw.teacherStudents) ? raw.teacherStudents : d.teacherStudents,
    rosters,
  }
}

export function loadTeacherState() {
  try {
    const raw = localStorage.getItem(TEACHER_STORAGE_KEY)
    if (!raw) return getDefaultTeacherState()
    return normalizeState(JSON.parse(raw))
  } catch {
    return getDefaultTeacherState()
  }
}

export function saveTeacherState(next) {
  try {
    localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(next))
    notify()
  } catch {
    /* ignore */
  }
}

export function patchTeacherState(updater) {
  const prev = loadTeacherState()
  const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
  saveTeacherState(next)
  return next
}

export function resetTeacherToDefaults() {
  const d = getDefaultTeacherState()
  saveTeacherState(d)
  return d
}

/** Thống kê dashboard (động). */
export function computeTeacherDashboardStats(s) {
  const myClasses = s.classes.length
  const totalStudents = s.classes.reduce((acc, c) => acc + (Number(c.students) || 0), 0)
  const pendingGrading = s.gradingQueue.filter((g) => g.status === 'pending').length
  const upcomingSessions = s.schedule.length
  return { myClasses, totalStudents, pendingGrading, upcomingSessions }
}
