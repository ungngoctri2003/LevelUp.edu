import { useMemo } from 'react'
import Panel from '../../dashboard/Panel'
import { teacherClassLoadBuckets } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'
import { VerticalBarChartBody } from './chartPrimitives'

export default function AdminTeacherClassLoadChart({ teachers }) {
  const { isDark, gridStroke, tickFill, classFill } = useAdminStatsChartTheme()
  const data = useMemo(() => teacherClassLoadBuckets(teachers), [teachers])
  const hasData = (teachers || []).length > 0

  return (
    <Panel
      title="Giáo viên theo số lớp phụ trách"
      subtitle="Đếm lớp thực tế đang gán cho từng GV"
      className="overflow-hidden"
    >
      <div className="mt-2 min-h-[260px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có giáo viên" />
        ) : (
          <VerticalBarChartBody
            data={data}
            isDark={isDark}
            gridStroke={gridStroke}
            tickFill={tickFill}
            barFill={classFill}
            unit="người"
            slantXAxis={false}
            height={260}
          />
        )}
      </div>
    </Panel>
  )
}
