import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Panel from '../dashboard/Panel'
import { inputAdmin } from '../dashboard/dashboardStyles'
import { useTheme } from '../../context/ThemeContext'
import {
  aggregatePaidRevenueForChart,
  listYearOptionsForRevenue,
  sumChartTotals,
} from '../../utils/adminPaymentHelpers.js'

const moneyFull = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function formatCompactVnd(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '0'
  if (x >= 1e9) return `${(x / 1e9).toFixed(1).replace(/\.0$/, '')} tỷ`
  if (x >= 1e6) return `${(x / 1e6).toFixed(1).replace(/\.0$/, '')} tr`
  if (x >= 1e3) return `${Math.round(x / 1e3)} k`
  return String(Math.round(x))
}

function ChartTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  const classAmt = payload.find((p) => p.dataKey === 'classAmount')?.value ?? 0
  const courseAmt = payload.find((p) => p.dataKey === 'courseAmount')?.value ?? 0
  const total = Number(classAmt) + Number(courseAmt)
  const border = isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white'
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-xs shadow-lg ${border}`}
    >
      <p className={`mb-2 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{label}</p>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-6">
          <span className="text-cyan-600 dark:text-cyan-300">Lớp học</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{moneyFull.format(classAmt)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-fuchsia-600 dark:text-fuchsia-300">Khóa học</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{moneyFull.format(courseAmt)}</span>
        </div>
        <div
          className={`mt-1.5 flex justify-between gap-6 border-t pt-1.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}
        >
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tổng</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {moneyFull.format(total)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AdminRevenueChart({ payments }) {
  const { resolvedMode } = useTheme()
  const isDark = resolvedMode === 'dark'

  const yearOptions = useMemo(() => listYearOptionsForRevenue(payments), [payments])
  const defaultYear = yearOptions[0] ?? new Date().getFullYear()

  const [year, setYear] = useState(defaultYear)
  const [monthFilter, setMonthFilter] = useState('')

  useEffect(() => {
    if (!yearOptions.includes(year)) setYear(defaultYear)
  }, [yearOptions, defaultYear, year])

  const chart = useMemo(() => {
    const y = yearOptions.includes(year) ? year : defaultYear
    const m = monthFilter === '' ? null : Number(monthFilter)
    return aggregatePaidRevenueForChart(payments, y, m)
  }, [payments, year, monthFilter, yearOptions, defaultYear])

  const totals = useMemo(() => sumChartTotals(chart.data), [chart.data])
  const hasData = totals.grandTotal > 0

  const gridStroke = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.35)'
  const tickFill = isDark ? '#94a3b8' : '#64748b'
  const classFill = isDark ? '#22d3ee' : '#0891b2'
  const courseFill = isDark ? '#e879f9' : '#c026d3'

  const subtitle =
    monthFilter === ''
      ? `Theo tháng trong năm ${chart.year} — chỉ giao dịch đã thanh toán`
      : `Theo ngày — tháng ${monthFilter}/${chart.year} — chỉ giao dịch đã thanh toán`

  return (
    <Panel
      variant="highlight"
      title="Doanh thu theo thời gian"
      subtitle={subtitle}
      className="overflow-hidden"
    >
      <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            Năm
            <select
              className={`${inputAdmin} min-w-28 cursor-pointer`}
              value={yearOptions.includes(year) ? year : defaultYear}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            Tháng
            <select
              className={`${inputAdmin} min-w-40 cursor-pointer`}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="">Cả năm</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-900 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-200">
            Lớp: {moneyFull.format(totals.classTotal)}
          </span>
          <span className="inline-flex items-center rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-900 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/15 dark:text-fuchsia-200">
            Khóa: {moneyFull.format(totals.courseTotal)}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-white/15 dark:bg-white/10 dark:text-white">
            Tổng: {moneyFull.format(totals.grandTotal)}
          </span>
        </div>
      </div>

      <div className="mt-6 min-h-[300px] w-full">
        {!hasData ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-center dark:border-white/15 dark:bg-white/3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Chưa có doanh thu đã thanh toán
            </p>
            <p className="mt-1 max-w-sm px-4 text-xs text-slate-500 dark:text-slate-500">
              Trong khoảng thời gian đã chọn không có giao dịch trạng thái &quot;Đã thanh toán&quot; hoặc số tiền
              chưa được ghi nhận.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chart.data}
              margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
              />
              <YAxis
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactVnd}
                width={48}
              />
              <Tooltip
                content={(tipProps) => <ChartTooltip {...tipProps} isDark={isDark} />}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                formatter={(value) => (
                  <span className="text-slate-700 dark:text-slate-300">{value}</span>
                )}
              />
              <Bar dataKey="classAmount" name="Lớp học" stackId="rev" fill={classFill} maxBarSize={48} />
              <Bar
                dataKey="courseAmount"
                name="Khóa học"
                stackId="rev"
                fill={courseFill}
                maxBarSize={48}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}
