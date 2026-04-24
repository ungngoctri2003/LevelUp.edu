import { useTheme } from '../../../context/ThemeContext'

export function useAdminStatsChartTheme() {
  const { resolvedMode } = useTheme()
  const isDark = resolvedMode === 'dark'
  return {
    isDark,
    gridStroke: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.35)',
    tickFill: isDark ? '#94a3b8' : '#64748b',
    tooltipBorder: isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white',
    classFill: isDark ? '#22d3ee' : '#0891b2',
    courseFill: isDark ? '#e879f9' : '#c026d3',
  }
}
