import { useMemo } from 'react'
import Panel from '../../dashboard/Panel'
import { countStudentsBySource } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'
import { HorizontalBarChartBody } from './chartPrimitives'

export default function AdminStudentSourceChart({ students }) {
  const { isDark, gridStroke, tickFill, classFill } = useAdminStatsChartTheme()
  const data = useMemo(() => countStudentsBySource(students), [students])
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Panel title="Học viên theo nguồn" subtitle="Nguồn ghi nhận khi tạo hồ sơ (đăng ký, quản trị…)" className="overflow-hidden">
      <div className="mt-2 min-h-[240px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có học viên" />
        ) : (
          <HorizontalBarChartBody
            data={data}
            isDark={isDark}
            gridStroke={gridStroke}
            tickFill={tickFill}
            barFill={classFill}
            unit="học viên"
            yAxisWidth={140}
          />
        )}
      </div>
    </Panel>
  )
}
