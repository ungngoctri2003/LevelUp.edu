/** Trạng thái rỗng — icon + tiêu đề + mô tả + optional action */
export default function EmptyState({ icon = '📭', title, description, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-2xl">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
