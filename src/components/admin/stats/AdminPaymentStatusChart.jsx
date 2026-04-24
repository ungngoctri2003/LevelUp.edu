import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '../../dashboard/Panel'
import { countPaymentStatusByKind } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'

function StackTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  const border = isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white'
  const classAmt = payload.find((p) => p.dataKey === 'class')?.value ?? 0
  const courseAmt = payload.find((p) => p.dataKey === 'course')?.value ?? 0
  const total = Number(classAmt) + Number(courseAmt)
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs shadow-lg ${border}`}>
      <p className={`mb-2 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{label}</p>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-6">
          <span className="text-cyan-600 dark:text-cyan-300">Lớp học</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{Number(classAmt).toLocaleString('vi-VN')}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-fuchsia-600 dark:text-fuchsia-300">Khóa học</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{Number(courseAmt).toLocaleString('vi-VN')}</span>
        </div>
        <div
          className={`mt-1.5 flex justify-between gap-6 border-t pt-1.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}
        >
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tổng</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {total.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AdminPaymentStatusChart({ payments }) {
  const { isDark, gridStroke, tickFill, classFill, courseFill } = useAdminStatsChartTheme()
  const data = useMemo(() => countPaymentStatusByKind(payments), [payments])
  const hasData = useMemo(() => data.some((r) => r.class + r.course > 0), [data])

  return (
    <Panel
      title="Giao dịch theo trạng thái"
      subtitle="Chồng lớp học và khóa học — mọi yêu cầu thanh toán"
      className="overflow-hidden"
    >
      <div className="mt-2 min-h-[280px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có giao dịch" hint="Khi có yêu cầu thanh toán, phân bố trạng thái hiển thị tại đây." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 4 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="name"
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
                content={(tipProps) => <StackTooltip {...tipProps} isDark={isDark} />}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => <span className="text-slate-700 dark:text-slate-300">{value}</span>}
              />
              <Bar dataKey="class" name="Lớp học" stackId="pay" fill={classFill} maxBarSize={48} />
              <Bar
                dataKey="course"
                name="Khóa học"
                stackId="pay"
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
