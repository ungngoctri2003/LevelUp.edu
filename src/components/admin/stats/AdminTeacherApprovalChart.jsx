import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import Panel from '../../dashboard/Panel'
import { countByTeacherStatus } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'

const PIE_COLORS = ['#059669', '#d97706', '#dc2626', '#64748b']

function PieTooltip({ active, payload, isDark }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  const border = isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white'
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-lg ${border}`}>
      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{p.name}</p>
      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{p.value.toLocaleString('vi-VN')} giáo viên</p>
    </div>
  )
}

export default function AdminTeacherApprovalChart({ teachers }) {
  const { isDark } = useAdminStatsChartTheme()
  const data = useMemo(() => countByTeacherStatus(teachers), [teachers])
  const total = useMemo(() => data.reduce((s, x) => s + x.value, 0), [data])
  const hasData = total > 0

  return (
    <Panel title="Giáo viên theo duyệt hồ sơ" subtitle="Đã duyệt, chờ duyệt, tạm khóa" className="overflow-hidden">
      <div className="mt-2 min-h-[260px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có dữ liệu giáo viên" hint="Thêm hoặc tải lại danh sách giáo viên." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
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
          Tổng: {total.toLocaleString('vi-VN')} giáo viên
        </p>
      ) : null}
    </Panel>
  )
}
