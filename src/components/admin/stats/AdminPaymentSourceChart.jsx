import { useMemo } from 'react'
import Panel from '../../dashboard/Panel'
import { countPaymentsBySource } from '../../../utils/adminStatsHelpers'
import { useAdminStatsChartTheme } from './useAdminStatsChartTheme'
import ChartEmptyState from './ChartEmptyState'
import { HorizontalBarChartBody } from './chartPrimitives'

export default function AdminPaymentSourceChart({ payments }) {
  const { isDark, gridStroke, tickFill, courseFill } = useAdminStatsChartTheme()
  const data = useMemo(() => countPaymentsBySource(payments), [payments])
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Panel title="Thanh toán theo kênh" subtitle="Hình thức thanh toán — gồm giao dịch lớp và khóa học" className="overflow-hidden">
      <div className="mt-2 min-h-[240px] w-full">
        {!hasData ? (
          <ChartEmptyState title="Chưa có giao dịch" />
        ) : (
          <HorizontalBarChartBody
            data={data}
            isDark={isDark}
            gridStroke={gridStroke}
            tickFill={tickFill}
            barFill={courseFill}
            unit="giao dịch"
            yAxisWidth={118}
          />
        )}
      </div>
    </Panel>
  )
}
