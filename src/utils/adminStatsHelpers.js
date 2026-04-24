/** Nhãn hiển thị — đồng bộ với các trang admin tương ứng */

export const STUDENT_STATUS_LABELS = {
  active: 'Đang học',
  trial: 'Học thử',
  inactive: 'Tạm dừng',
}

export const TEACHER_STATUS_LABELS = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  suspended: 'Tạm khóa',
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  cancelled: 'Hủy',
}

const PAYMENT_STATUS_ORDER = ['pending', 'paid', 'cancelled']

/**
 * @param {Array<{ status?: string }>} students
 * @returns {Array<{ key: string, name: string, value: number }>}
 */
export function countByStudentStatus(students) {
  const map = {}
  for (const s of students || []) {
    const key = (s && s.status) || 'active'
    map[key] = (map[key] || 0) + 1
  }
  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      name: STUDENT_STATUS_LABELS[key] || key,
      value,
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
}

/**
 * @param {Array<{ status?: string }>} teachers
 * @returns {Array<{ key: string, name: string, value: number }>}
 */
export function countByTeacherStatus(teachers) {
  const map = {}
  for (const t of teachers || []) {
    const key = (t && t.status) || 'pending'
    map[key] = (map[key] || 0) + 1
  }
  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      name: TEACHER_STATUS_LABELS[key] || key,
      value,
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
}

/**
 * @param {Array<{ name?: string, code?: string, id?: number, student_count?: number }>} classes
 * @param {number} limit
 * @returns {Array<{ label: string, value: number }>}
 */
export function topClassesByEnrollment(classes, limit = 10) {
  const n = Number(limit)
  const cap = Number.isFinite(n) && n > 0 ? n : 10
  return [...(classes || [])]
    .sort((a, b) => (Number(b?.student_count) || 0) - (Number(a?.student_count) || 0))
    .slice(0, cap)
    .map((c) => {
      const raw = c?.name || c?.code || `Lớp #${c?.id ?? '—'}`
      const label = raw.length > 40 ? `${raw.slice(0, 37)}…` : raw
      return { label, value: Number(c?.student_count) || 0 }
    })
}

/**
 * @param {Array<{ payment_status?: string, payment_kind?: string }>} payments
 * @returns {Array<{ name: string, status: string, class: number, course: number }>}
 */
export function countPaymentStatusByKind(payments) {
  const rows = PAYMENT_STATUS_ORDER.map((status) => ({
    name: PAYMENT_STATUS_LABELS[status] || status,
    status,
    class: 0,
    course: 0,
  }))
  const idx = Object.fromEntries(rows.map((r, i) => [r.status, i]))
  for (const p of payments || []) {
    const st = p?.payment_status || 'pending'
    const i = idx[st]
    if (i === undefined) continue
    if (p?.payment_kind === 'course') rows[i].course += 1
    else rows[i].class += 1
  }
  return rows
}

/**
 * Phân bố số lượt làm bài / học viên (chỉ học viên có trong `attemptCounts` đã có ≥1 lượt).
 * `0 lượt` = học viên không xuất hiện trong map (cần `totalStudents`).
 *
 * @param {Record<string, number>} attemptCounts
 * @param {number} totalStudents
 * @returns {Array<{ label: string, value: number }>}
 */
export function examAttemptPerStudentBuckets(attemptCounts, totalStudents = 0) {
  const map = attemptCounts && typeof attemptCounts === 'object' ? attemptCounts : {}
  const acted = Object.keys(map).length
  const total = Math.max(0, Number(totalStudents) || 0)
  const zero = Math.max(0, total - acted)

  let b12 = 0
  let b35 = 0
  let b6 = 0
  for (const v of Object.values(map)) {
    const n = Number(v)
    if (!Number.isFinite(n) || n < 1) continue
    if (n <= 2) b12 += 1
    else if (n <= 5) b35 += 1
    else b6 += 1
  }

  return [
    { label: '0 lượt', value: zero },
    { label: '1–2 lượt', value: b12 },
    { label: '3–5 lượt', value: b35 },
    { label: '6+ lượt', value: b6 },
  ]
}

/**
 * @param {Array<{ visible?: boolean }>} courses
 * @returns {Array<{ key: string, name: string, value: number }>}
 */
export function countCoursesVisibility(courses) {
  let vis = 0
  let hid = 0
  for (const c of courses || []) {
    if (c?.visible !== false) vis += 1
    else hid += 1
  }
  return [
    { key: 'visible', name: 'Hiển thị web', value: vis },
    { key: 'hidden', name: 'Đang ẩn', value: hid },
  ].filter((x) => x.value > 0)
}

/**
 * @param {Array<Record<string, unknown>>} items
 * @param {string} field
 * @param {{ limit?: number, otherLabel?: string }} opts
 * @returns {Array<{ label: string, value: number }>}
 */
export function countByField(items, field, opts = {}) {
  const limit = opts.limit ?? 12
  const otherLabel = opts.otherLabel ?? 'Khác'
  const map = {}
  for (const it of items || []) {
    const raw = it?.[field]
    const k = raw != null && String(raw).trim() !== '' ? String(raw).trim() : '—'
    map[k] = (map[k] || 0) + 1
  }
  let entries = Object.entries(map).sort((a, b) => b[1] - a[1])
  if (limit > 0 && entries.length > limit) {
    const top = entries.slice(0, limit - 1)
    const rest = entries.slice(limit - 1).reduce((s, [, v]) => s + v, 0)
    if (rest > 0) top.push([otherLabel, rest])
    entries = top
  }
  return entries.map(([label, value]) => ({
    label: label.length > 28 ? `${label.slice(0, 25)}…` : label,
    value,
  }))
}

/**
 * @param {Array<{ published?: boolean, assigned?: boolean }>} exams
 * @returns {Array<{ label: string, value: number }>}
 */
export function summarizeExamsMetrics(exams) {
  const list = exams || []
  const n = list.length
  const published = list.filter((e) => e?.published !== false).length
  const assigned = list.filter((e) => e?.assigned).length
  return [
    { label: 'Đã xuất bản', value: published },
    { label: 'Chưa xuất bản', value: n - published },
    { label: 'Đã giao bài', value: assigned },
    { label: 'Chưa giao bài', value: n - assigned },
  ]
}

const STUDENT_SOURCE_LABELS = {
  registered: 'Đăng ký',
  admin: 'Tạo admin',
  imported: 'Nhập liệu',
}

/**
 * @param {Array<{ source?: string }>} students
 * @returns {Array<{ key: string, label: string, value: number }>}
 */
export function countStudentsBySource(students) {
  const map = {}
  for (const s of students || []) {
    const src = (s?.source && String(s.source).trim()) || 'registered'
    map[src] = (map[src] || 0) + 1
  }
  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      label: STUDENT_SOURCE_LABELS[key] || key,
      value,
    }))
    .sort((a, b) => b.value - a.value)
}

const PAYMENT_SOURCE_LABELS = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPAY',
  other: 'Khác',
}

/**
 * @param {Array<{ payment_source?: string }>} payments
 * @returns {Array<{ key: string, label: string, value: number }>}
 */
export function countPaymentsBySource(payments) {
  const map = {}
  for (const p of payments || []) {
    const src = (p?.payment_source && String(p.payment_source).trim()) || 'other'
    map[src] = (map[src] || 0) + 1
  }
  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      label: PAYMENT_SOURCE_LABELS[key] || key,
      value,
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * @param {Array<{ classes?: number }>} teachers
 * @returns {Array<{ label: string, value: number }>}
 */
export function teacherClassLoadBuckets(teachers) {
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  for (const t of teachers || []) {
    const n = Number(t?.classes) || 0
    if (n <= 0) b0 += 1
    else if (n === 1) b1 += 1
    else if (n === 2) b2 += 1
    else b3 += 1
  }
  return [
    { label: '0 lớp', value: b0 },
    { label: '1 lớp', value: b1 },
    { label: '2 lớp', value: b2 },
    { label: '3+ lớp', value: b3 },
  ]
}

