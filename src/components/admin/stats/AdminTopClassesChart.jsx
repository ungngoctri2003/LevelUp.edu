import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '../../dashboard/Panel'
import { topClassesByEnrollment } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'

function BarTooltip({ active, payload, isDark }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  const border = isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white'
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-lg ${border}`}>
      <p className={`mb-1 max-w-[240px] font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{row.label}</p>
      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
        {Number(row.value).toLocaleString('vi-VN')} học viên
      </p>
    </div>
  )
}

export default function AdminTopClassesChart({ classes, limit = 10 }) {
  const { isDark, gridStroke, tickFill, classFill } = useAdminStatsChartTheme()
  const data = useMemo(() => topClassesByEnrollment(classes, limit), [classes, limit])
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Panel
      title="Lớp có nhiều học viên"
      subtitle={`Top ${limit} lớp theo số người đăng ký`}
      className="overflow-hidden"
    >
      <div className="mt-2 min-h-[280px] w-full">
        {!hasData ? (
          <ChartEmptyState
            title="Chưa có lớp hoặc chưa ghi danh"
            hint="Khi có lớp và học viên trong lớp, biểu đồ sẽ hiển thị tại đây."
          />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, data.length * 36)}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
              barCategoryGap="12%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={118}
                tick={{ fill: tickFill, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={(tipProps) => <BarTooltip {...tipProps} isDark={isDark} />}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)' }}
              />
              <Bar dataKey="value" name="Học viên" fill={classFill} maxBarSize={22} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}
