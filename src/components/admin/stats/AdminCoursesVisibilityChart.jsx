import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import Panel from '../../dashboard/Panel'
import { countCoursesVisibility } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'

const PIE_COLORS = ['#059669', '#64748b']

function PieTooltip({ active, payload, isDark }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  const border = isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white'
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-lg ${border}`}>
      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{p.name}</p>
      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{p.value.toLocaleString('vi-VN')} khóa</p>
    </div>
  )
}

export default function AdminCoursesVisibilityChart({ courses }) {
  const { isDark } = useAdminStatsChartTheme()
  const data = useMemo(() => countCoursesVisibility(courses), [courses])
  const total = useMemo(() => data.reduce((s, x) => s + x.value, 0), [data])
  const hasData = total > 0

  return (
    <Panel title="Khóa học hiển thị / ẩn" subtitle="Khóa đang hiện trên website hay đang ẩn" className="overflow-hidden">
      <div className="mt-2 min-h-[240px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có khóa học" hint="Thêm khóa trong mục Khóa học & môn." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={82}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={data[i].key} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={(props) => <PieTooltip {...props} isDark={isDark} />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => <span className="text-slate-700 dark:text-slate-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {hasData ? (
        <p className={`mt-2 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Tổng: {total.toLocaleString('vi-VN')} khóa
        </p>
      ) : null}
    </Panel>
  )
}
