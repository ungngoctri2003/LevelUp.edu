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
      'rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md',
    subtle: 'rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm',
    highlight:
      'rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-fuchsia-500/10 shadow-lg shadow-black/20 backdrop-blur-md',
    /** Nền sáng + dark: — nhúng trang marketing (vd. /lop-hoc/:id) */
    public:
      'rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
  }

  const isPublic = variant === 'public'
  const headDivider = noDivider ? '' : isPublic ? 'mb-5 border-b border-gray-200 pb-5 dark:border-white/5' : 'mb-5 border-b border-white/5 pb-5'

  return (
    <section id={id} className={`${variants[variant] || variants.default} ${padding ? 'p-6 md:p-7' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className={headDivider}>
          {title && (
            <h3
              className={`text-lg font-semibold tracking-tight ${isPublic ? 'text-gray-900 dark:text-white' : 'text-white'}`}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p className={`mt-1 text-sm ${isPublic ? 'text-gray-600 dark:text-slate-500' : 'text-slate-500'}`}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
