/**
 * Tách chuỗi dạng datetime-local (YYYY-MM-DDTHH:mm, giờ địa phương) cho input type=date / type=time.
 */
export function splitDatetimeLocalParts(s) {
  if (!s || typeof s !== 'string') return { date: '', time: '' }
  const t = s.trim()
  if (!t) return { date: '', time: '' }
  const [d, rest] = t.split('T')
  if (!d) return { date: '', time: '' }
  const timePart = rest ? rest.slice(0, 5) : ''
  return { date: d, time: timePart }
}

/**
 * Ghép ngày + giờ địa phương → chuỗi parse được bởi `new Date(...)` (giống datetime-local).
 * Không có ngày → ''.
 * Có ngày, không chọn giờ → 23:59 (cuối ngày).
 */
export function mergeDateTimeForDeadline(dateStr, timeStr) {
  const d = String(dateStr || '').trim()
  if (!d) return ''
  const tm = String(timeStr || '').trim()
  const t = tm || '23:59'
  return `${d}T${t}`
}
