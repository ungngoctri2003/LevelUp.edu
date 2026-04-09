/**
 * Thẻ số liệu — accent gradient + typography
 */
export default function StatCard({ label, value, hint, accent = 'default' }) {
  const topBar = {
    default: 'from-cyan-400/90 via-fuchsia-500/60 to-transparent',
    admin: 'from-cyan-400/90 via-fuchsia-500/60 to-transparent',
    teacher: 'from-emerald-400/90 via-teal-500/50 to-transparent',
    student: 'from-sky-400/90 via-cyan-500/50 to-transparent',
  }

  const bar = topBar[accent] || topBar.default

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:ring-0 dark:hover:border-white/15 dark:hover:shadow-lg dark:hover:shadow-black/20">
      <div className={`h-1 w-full bg-gradient-to-r ${bar} opacity-90`} />
      <div className="p-5 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
        {hint && <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}
