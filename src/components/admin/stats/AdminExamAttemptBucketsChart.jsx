import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '../../dashboard/Panel'
import { examAttemptPerStudentBuckets } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'

function BarTooltip({ active, payload, isDark }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  const border = isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white'
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-lg ${border}`}>
      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{row.label}</p>
      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
        {Number(row.value).toLocaleString('vi-VN')} học viên
      </p>
    </div>
  )
}

export default function AdminExamAttemptBucketsChart({ attemptCounts, totalStudents }) {
  const { isDark, gridStroke, tickFill, courseFill } = useAdminStatsChartTheme()
  const data = useMemo(
    () => examAttemptPerStudentBuckets(attemptCounts, totalStudents),
    [attemptCounts, totalStudents],
  )
  const hasData = useMemo(() => data.some((d) => d.value > 0), [data])

  return (
    <Panel
      title="Lượt làm bài kiểm tra (theo học viên)"
      subtitle="Phân nhóm theo tổng lượt làm bài đã ghi nhận — 0 lượt: chưa từng làm bài kiểm tra"
      className="overflow-hidden"
    >
      <div className="mt-2 min-h-[280px] w-full">
        {!hasData ? (
          <ChartEmptyState
            title="Chưa có học viên hoặc chưa có lượt thi"
            hint="Khi có học viên và bài làm, phân bố sẽ hiển thị tại đây."
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 4 }} barCategoryGap="18%">
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
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                content={(tipProps) => <BarTooltip {...tipProps} isDark={isDark} />}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)' }}
              />
              <Bar dataKey="value" name="Học viên" fill={courseFill} maxBarSize={48} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}
