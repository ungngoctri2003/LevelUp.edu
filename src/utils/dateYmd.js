import { format } from 'date-fns'

/**
 * Parse `YYYY-MM-DD` thành Date nửa đêm local (tránh lệch UTC).
 * @param {string} s
 * @returns {Date | null}
 */
export function parseYmdLocal(s) {
  if (!s || typeof s !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

/**
 * @param {Date} d
 * @returns {string} `YYYY-MM-DD` hoặc `''`
 */
export function formatYmdLocal(d) {
  if (!d || Number.isNaN(d.getTime())) return ''
  return format(d, 'yyyy-MM-dd')
}
