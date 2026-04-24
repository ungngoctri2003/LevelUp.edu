import { useMemo } from 'react'
import Panel from '../../dashboard/Panel'
import { summarizeExamsMetrics } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'
import { VerticalBarChartBody } from './chartPrimitives'

export default function AdminExamsMetricsChart({ exams }) {
  const { isDark, gridStroke, tickFill, courseFill } = useAdminStatsChartTheme()
  const data = useMemo(() => summarizeExamsMetrics(exams), [exams])
  const hasData = (exams || []).length > 0

  return (
    <Panel
      title="Bài kiểm tra — xuất bản & giao bài"
      subtitle="So sánh nhanh trên toàn bộ đề trong hệ thống"
      className="overflow-hidden"
    >
      <div className="mt-2 min-h-[280px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có đề thi" hint="Tạo đề trong mục Bài kiểm tra." />
        ) : (
          <VerticalBarChartBody
            data={data}
            isDark={isDark}
            gridStroke={gridStroke}
            tickFill={tickFill}
            barFill={courseFill}
            unit="đề"
            slantXAxis={false}
            height={280}
          />
        )}
      </div>
    </Panel>
  )
}
