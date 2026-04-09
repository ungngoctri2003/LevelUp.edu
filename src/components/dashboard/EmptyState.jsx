/** Trạng thái rỗng — icon + tiêu đề + mô tả + optional action
 *  @param {'dashboard' | 'public'} [surface] — giữ prop để tương thích; luôn dùng theme sáng/tối chung
 */
export default function EmptyState({
  icon = '📭',
  title,
  description,
  children,
  className = '',
  surface: _surface,
}) {
  const box =
    'rounded-2xl border border-dashed border-slate-400 bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm dark:border-white/15 dark:bg-white/[0.03] dark:shadow-none dark:ring-0'
  const iconWrap =
    'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 text-2xl shadow-sm dark:border-white/10 dark:bg-black/30 dark:shadow-none'
  const titleCls = 'text-base font-semibold text-gray-900 dark:text-white'
  const descCls = 'mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-700 dark:text-slate-400'

  return (
    <div className={`${box} ${className}`}>
      <div className={iconWrap}>{icon}</div>
      <h3 className={titleCls}>{title}</h3>
      {description && <p className={descCls}>{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
