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
  id,
}) {
  const variants = {
    default:
      'rounded-2xl border border-slate-300 bg-white text-gray-900 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:ring-0',
    subtle:
      'rounded-2xl border border-slate-200 bg-slate-50/90 text-gray-900 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.02] dark:text-white dark:ring-0',
    highlight:
      'rounded-2xl border border-cyan-300/90 bg-gradient-to-br from-cyan-50/90 via-white to-fuchsia-50/70 text-gray-900 shadow-sm ring-1 ring-cyan-900/5 backdrop-blur-md dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-white/[0.03] dark:to-fuchsia-500/10 dark:text-white dark:shadow-lg dark:shadow-black/20 dark:ring-0',
    /** Nền sáng + dark: — nhúng trang marketing (vd. /lop-hoc/:id) */
    public:
      'rounded-2xl border border-slate-300 bg-white text-gray-900 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:ring-0',
  }

  const headDivider = noDivider
    ? ''
    : 'mb-5 border-b border-slate-200 pb-5 dark:border-white/5'

  return (
    <section id={id} className={`${variants[variant] || variants.default} ${padding ? 'p-6 md:p-7' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className={headDivider}>
          {title && (
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
