/** Thứ 2 → chủ nhật (index 0 = Thứ 2) */
export const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

export function weekdayLabelFromDate(d) {
  const day = d.getDay()
  const idx = day === 0 ? 6 : day - 1
  return WEEK_DAYS[idx]
}

export function formatTimeHm(d) {
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTimeRange(start, end) {
  const a = formatTimeHm(start)
  if (!end || Number.isNaN(end.getTime())) return a
  return `${a}–${formatTimeHm(end)}`
}

export function toDatetimeLocalValue(d) {
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Giá trị cho `<input type="date">` (theo giờ local) */
export function toDateInputValue(d) {
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Giá trị cho `<input type="time">` (theo giờ local) */
export function toTimeInputValue(d) {
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Ghép YYYY-MM-DD + HH:mm thành Date local */
export function localDateFromParts(dateStr, timeStr) {
  if (!dateStr?.trim() || !timeStr?.trim()) return null
  const [y, mo, d] = dateStr.split('-').map((x) => Number(x))
  const tp = timeStr.split(':')
  const h = Number(tp[0])
  const mi = Number(tp[1] ?? 0)
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

/** Chuẩn hóa mọi giá trị DB → online | offline (chỉ dùng trong UI / logic) */
export function normalizeDeliveryMode(raw) {
  if (raw === 'offline' || raw === 'truc_tuyen') return 'offline'
  if (raw === 'online' || raw === 'hoc_online') return 'online'
  return 'online'
}

/**
 * Giá trị ghi vào cột `schedule_slots.delivery_mode`.
 * Postgres (migration 20260407) thường chỉ chấp nhận `truc_tuyen` | `hoc_online`.
 * Nếu DB dùng CHECK (online, offline), đặt VITE_SCHEDULE_DELIVERY_MODE_NEW=true.
 */
export function deliveryModeForSupabase(uiMode) {
  const m = normalizeDeliveryMode(uiMode)
  const useNewEnum = import.meta.env.VITE_SCHEDULE_DELIVERY_MODE_NEW === 'true'
  if (useNewEnum) return m === 'offline' ? 'offline' : 'online'
  return m === 'offline' ? 'truc_tuyen' : 'hoc_online'
}

export function deliveryModeLabel(mode) {
  const m = normalizeDeliveryMode(mode)
  if (m === 'offline') return 'Học Offline'
  if (m === 'online') return 'Học Online'
  return '—'
}

export function daySortKey(dayLabel) {
  const i = WEEK_DAYS.indexOf(dayLabel)
  return i >= 0 ? i : 98
}

/** Chuỗi time_range cũ — lấy phút bắt đầu để sắp xếp */
export function parseTimeStartMinutes(timeRange) {
  const m = String(timeRange).match(/(\d{1,2})\s*:\s*(\d{2})/)
  if (!m) return 24 * 60
  const h = Math.min(23, Math.max(0, Number(m[1])))
  const min = Math.min(59, Math.max(0, Number(m[2])))
  return h * 60 + min
}

export function defaultNewSlotFormValues() {
  const s = new Date()
  s.setSeconds(0, 0)
  s.setMinutes(0)
  s.setHours(s.getHours() + 1)
  const e = new Date(s)
  e.setMinutes(e.getMinutes() + 90)
  return {
    classId: '',
    startDate: toDateInputValue(s),
    startTime: toTimeInputValue(s),
    endDate: toDateInputValue(e),
    endTime: toTimeInputValue(e),
    deliveryMode: 'offline',
  }
}
