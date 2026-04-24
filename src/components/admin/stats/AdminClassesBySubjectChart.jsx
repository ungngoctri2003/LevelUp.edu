import { useMemo } from 'react'
import Panel from '../../dashboard/Panel'
import { countByField } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'
import { VerticalBarChartBody } from './chartPrimitives'

export default function AdminClassesBySubjectChart({ classes }) {
  const { isDark, gridStroke, tickFill, courseFill } = useAdminStatsChartTheme()
  const data = useMemo(() => countByField(classes, 'subject', { limit: 10 }), [classes])
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Panel title="Lớp học theo môn" subtitle="Số lớp theo môn dạy" className="overflow-hidden">
      <div className="mt-2 min-h-[300px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có lớp" hint="Tạo lớp và gán môn để xem phân bố." />
        ) : (
          <VerticalBarChartBody
            data={data}
            isDark={isDark}
            gridStroke={gridStroke}
            tickFill={tickFill}
            barFill={courseFill}
            unit="lớp"
          />
        )}
      </div>
    </Panel>
  )
}
