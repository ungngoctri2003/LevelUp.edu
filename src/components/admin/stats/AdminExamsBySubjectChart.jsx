import { useMemo } from 'react'
import Panel from '../../dashboard/Panel'
import { countByField } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'
import { VerticalBarChartBody } from './chartPrimitives'

export default function AdminExamsBySubjectChart({ exams }) {
  const { isDark, gridStroke, tickFill, classFill } = useAdminStatsChartTheme()
  const data = useMemo(() => countByField(exams, 'subject', { limit: 10 }), [exams])
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Panel title="Đề thi theo môn" subtitle="Phân bố theo môn gắn với từng đề" className="overflow-hidden">
      <div className="mt-2 min-h-[300px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có đề hoặc chưa gán môn" />
        ) : (
          <VerticalBarChartBody
            data={data}
            isDark={isDark}
            gridStroke={gridStroke}
            tickFill={tickFill}
            barFill={classFill}
            unit="đề"
          />
        )}
      </div>
    </Panel>
  )
}
