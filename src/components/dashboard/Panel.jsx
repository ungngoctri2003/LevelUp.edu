/**
 * Khối nội dung (card) — viền, blur, shadow đồng bộ khu vực dashboard
 */
export default function Panel({
  title,
  subtitle,
  children,
  className = '',
  padding = true,
  noDivider = false,
  variant = 'default',
}) {
  const variants = {
    default:
      'rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md',
    subtle: 'rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm',
    highlight:
      'rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-fuchsia-500/10 shadow-lg shadow-black/20 backdrop-blur-md',
  }

  return (
    <section className={`${variants[variant] || variants.default} ${padding ? 'p-6 md:p-7' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className={noDivider ? '' : 'mb-5 border-b border-white/5 pb-5'}>
          {title && <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
