import { useMemo } from 'react'
import Panel from '../../dashboard/Panel'
import { countByField } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'
import { VerticalBarChartBody } from './chartPrimitives'

export default function AdminCoursesBySubjectChart({ courses }) {
  const { isDark, gridStroke, tickFill, classFill } = useAdminStatsChartTheme()
  const data = useMemo(() => countByField(courses, 'subject', { limit: 10 }), [courses])
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Panel title="Khóa học theo môn" subtitle="Số khóa theo tên môn" className="overflow-hidden">
      <div className="mt-2 min-h-[300px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có dữ liệu" hint="Thêm khóa gắn môn để xem phân bố." />
        ) : (
          <VerticalBarChartBody
            data={data}
            isDark={isDark}
            gridStroke={gridStroke}
            tickFill={tickFill}
            barFill={classFill}
            unit="khóa"
          />
        )}
      </div>
    </Panel>
  )
}
