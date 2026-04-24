export default function ChartEmptyState({ title, hint }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-center dark:border-white/15 dark:bg-white/3">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
      {hint ? <p className="mt-1 max-w-sm px-4 text-xs text-slate-500 dark:text-slate-500">{hint}</p> : null}
    </div>
  )
}
