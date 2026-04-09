/** Trạng thái rỗng — icon + tiêu đề + mô tả + optional action
 *  @param {'dashboard' | 'public'} [surface='dashboard'] — public: theo theme sáng/tối trang chủ
 */
export default function EmptyState({
  icon = '📭',
  title,
  description,
  children,
  className = '',
  surface = 'dashboard',
}) {
  const box =
    surface === 'public'
      ? 'rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center backdrop-blur-sm dark:border-white/15 dark:bg-white/[0.03]'
      : 'rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-sm'
  const iconWrap =
    surface === 'public'
      ? 'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-2xl dark:border-white/10 dark:bg-black/30'
      : 'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-2xl'
  const titleCls = surface === 'public' ? 'text-base font-semibold text-gray-900 dark:text-white' : 'text-base font-semibold text-white'
  const descCls =
    surface === 'public'
      ? 'mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600 dark:text-slate-400'
      : 'mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400'

  return (
    <div className={`${box} ${className}`}>
      <div className={iconWrap}>{icon}</div>
      <h3 className={titleCls}>{title}</h3>
      {description && <p className={descCls}>{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
