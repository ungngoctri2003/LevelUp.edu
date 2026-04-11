/**
 * Dùng chung AdminPayments và biểu đồ doanh thu — cùng định nghĩa lớp / khóa.
 */

import { endOfDay, startOfDay } from 'date-fns'
import { parseYmdLocal } from './dateYmd.js'

/**
 * Lọc theo `submitted_at`, khoảng inclusive theo ngày local. Một trong hai biên có thể bỏ trống.
 * @param {string} fromStr `YYYY-MM-DD` hoặc rỗng
 * @param {string} toStr `YYYY-MM-DD` hoặc rỗng
 */
export function filterPaymentsBySubmittedDateRange(payments, fromStr, toStr) {
  const rows = payments || []
  if (!fromStr?.trim() && !toStr?.trim()) return rows

  let fromTs = null
  let toTs = null
  if (fromStr?.trim()) {
    const d = parseYmdLocal(fromStr.trim())
    if (d) fromTs = startOfDay(d).getTime()
  }
  if (toStr?.trim()) {
    const d = parseYmdLocal(toStr.trim())
    if (d) toTs = endOfDay(d).getTime()
  }

  return rows.filter((row) => {
    if (!row.submitted_at) return false
    const t = new Date(row.submitted_at).getTime()
    if (Number.isNaN(t)) return false
    if (fromTs != null && t < fromTs) return false
    if (toTs != null && t > toTs) return false
    return true
  })
}

export function partitionPayments(all) {
  const rows = all || []
  const classRows = rows.filter(
    (r) => r.payment_kind === 'class' || (r.class_id != null && r.payment_kind !== 'course'),
  )
  const courseRows = rows.filter((r) => r.payment_kind === 'course' || r.course_id != null)
  return { classRows, courseRows }
}

export function paidRevenueEffectiveDate(row) {
  const raw = row.confirmed_at || row.submitted_at
  if (!raw) return null
  const t = new Date(raw)
  return Number.isNaN(t.getTime()) ? null : t
}

/** Khớp logic phân loại với partition: ưu tiên khóa khi có course_id / payment_kind course */
export function revenueCategory(row) {
  if (row.payment_kind === 'course' || row.course_id != null) return 'course'
  return 'class'
}

function parseAmount(amount) {
  const n = Number(amount)
  return Number.isFinite(n) ? n : 0
}

/**
 * @param {unknown[]} payments
 * @param {number} year
 * @param {number | null} month — 1–12 hoặc null = cả năm
 */
export function aggregatePaidRevenueForChart(payments, year, month) {
  const rows = (payments || []).filter((r) => r.payment_status === 'paid')

  if (month == null) {
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      label: `T${i + 1}`,
      monthIndex: i,
      classAmount: 0,
      courseAmount: 0,
      key: `m${i + 1}`,
    }))
    for (const row of rows) {
      const dt = paidRevenueEffectiveDate(row)
      if (!dt || dt.getFullYear() !== year) continue
      const m = dt.getMonth()
      const amt = parseAmount(row.amount)
      const cat = revenueCategory(row)
      if (cat === 'course') buckets[m].courseAmount += amt
      else buckets[m].classAmount += amt
    }
    return { mode: 'year', year, data: buckets }
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const buckets = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    return {
      label: String(day),
      day,
      classAmount: 0,
      courseAmount: 0,
      key: `d${day}`,
    }
  })
  for (const row of rows) {
    const dt = paidRevenueEffectiveDate(row)
    if (!dt || dt.getFullYear() !== year || dt.getMonth() + 1 !== month) continue
    const day = dt.getDate()
    const amt = parseAmount(row.amount)
    const cat = revenueCategory(row)
    const idx = day - 1
    if (cat === 'course') buckets[idx].courseAmount += amt
    else buckets[idx].classAmount += amt
  }
  return { mode: 'month', year, month, data: buckets }
}

export function listYearOptionsForRevenue(payments) {
  const rows = (payments || []).filter((r) => r.payment_status === 'paid')
  const years = new Set()
  const yNow = new Date().getFullYear()
  years.add(yNow)
  for (const row of rows) {
    const dt = paidRevenueEffectiveDate(row)
    if (dt) years.add(dt.getFullYear())
  }
  return [...years].sort((a, b) => b - a)
}

export function sumChartTotals(chartData) {
  let classTotal = 0
  let courseTotal = 0
  for (const b of chartData || []) {
    classTotal += b.classAmount || 0
    courseTotal += b.courseAmount || 0
  }
  return { classTotal, courseTotal, grandTotal: classTotal + courseTotal }
}
