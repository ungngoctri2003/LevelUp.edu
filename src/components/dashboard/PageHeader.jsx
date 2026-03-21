/**
 * Tiêu đề trang dashboard — typography & layout thống nhất
 */
export default function PageHeader({ title, description, eyebrow, badge, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
