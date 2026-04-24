import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function CountTooltip({ active, payload, labelKey = 'label', isDark, unit }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  const border = isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white'
  const title = row[labelKey]
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs shadow-lg ${border}`}>
      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{title}</p>
      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
        {Number(row.value).toLocaleString('vi-VN')} {unit}
      </p>
    </div>
  )
}

export function VerticalBarChartBody({
  data,
  isDark,
  gridStroke,
  tickFill,
  barFill,
  height = 300,
  unit = '',
  margin = { top: 12, right: 8, left: 4, bottom: 4 },
  slantXAxis = true,
}) {
  const xAxisExtra = slantXAxis
    ? { interval: 0, angle: -28, textAnchor: 'end', height: 68 }
    : { interval: 'preserveStartEnd', height: 28 }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={margin} barCategoryGap="18%">
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: tickFill, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: gridStroke }}
          {...xAxisExtra}
        />
        <YAxis
          tick={{ fill: tickFill, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={36}
        />
        <Tooltip
          content={(tipProps) => <CountTooltip {...tipProps} isDark={isDark} unit={unit} />}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)' }}
        />
        <Bar dataKey="value" name="Số lượng" fill={barFill} maxBarSize={44} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function HorizontalBarChartBody({
  data,
  isDark,
  gridStroke,
  tickFill,
  barFill,
  height,
  unit = '',
  yAxisWidth = 128,
}) {
  const h = height ?? Math.max(260, data.length * 36)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
        barCategoryGap="14%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: tickFill, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: gridStroke }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={yAxisWidth}
          tick={{ fill: tickFill, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={(tipProps) => <CountTooltip {...tipProps} isDark={isDark} unit={unit} />}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)' }}
        />
        <Bar dataKey="value" name="Số lượng" fill={barFill} maxBarSize={22} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
