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
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-lg hover:shadow-black/20">
      <div className={`h-1 w-full bg-gradient-to-r ${bar} opacity-90`} />
      <div className="p-5 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
        {hint && <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}
