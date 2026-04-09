/** Form thân thiện thay cho sửa JSON thô trong admin CMS / bài giảng */

const btnGhost =
  'rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-300 hover:bg-white/5'
const btnDanger = 'rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10'

export function LinesTextarea({ label, hint, value, onChange, rows = 6, className = '', inputClassName }) {
  const ta =
    inputClassName ||
    'mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600'
  return (
    <label className={`block text-sm text-slate-400 ${className}`}>
      {label}
      {hint && <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span>}
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={ta} />
    </label>
  )
}

export const BENEFIT_ICON_OPTIONS = [
  { value: 'video', label: 'Video / bài giảng' },
  { value: 'device', label: 'Thiết bị / học mọi nơi' },
  { value: 'chart', label: 'Biểu đồ / lộ trình' },
  { value: 'support', label: 'Hỗ trợ' },
]

export function BenefitRowsEditor({ items, onChange, fieldClass }) {
  const fc = fieldClass || 'mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white'
  const updateAt = (i, patch) => {
    onChange(items.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  const removeAt = (i) => onChange(items.filter((_, j) => j !== i))
  return (
    <div className="space-y-4">
      {items.map((row, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mục {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => removeAt(i)}>
              Xóa mục
            </button>
          </div>
          <label className="block text-sm text-slate-400">
            Biểu tượng
            <select
              value={row.icon || 'video'}
              onChange={(e) => updateAt(i, { icon: e.target.value })}
              className={fc}
            >
              {BENEFIT_ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-2 block text-sm text-slate-400">
            Tiêu đề
            <input
              value={row.title || ''}
              onChange={(e) => updateAt(i, { title: e.target.value })}
              className={fc}
            />
          </label>
          <label className="mt-2 block text-sm text-slate-400">
            Mô tả
            <textarea
              rows={3}
              value={row.description || ''}
              onChange={(e) => updateAt(i, { description: e.target.value })}
              className={fc}
            />
          </label>
        </div>
      ))}
      <button
        type="button"
        className={btnGhost}
        onClick={() =>
          onChange([...items, { icon: 'video', title: '', description: '' }])
        }
      >
        + Thêm mục lợi ích
      </button>
    </div>
  )
}

const TESTIMONIAL_COLORS = [
  { value: 'indigo', label: 'Xanh indigo' },
  { value: 'purple', label: 'Tím' },
]

export function TestimonialRowsEditor({ items, onChange, fieldClass }) {
  const fc = fieldClass || 'mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white'
  const updateAt = (i, patch) => {
    onChange(items.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  const removeAt = (i) => onChange(items.filter((_, j) => j !== i))
  return (
    <div className="space-y-4">
      {items.map((row, i) => (
        <div key={row.id != null ? `t-${row.id}` : i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đánh giá {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => removeAt(i)}>
              Xóa
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm text-slate-400">
              Họ tên hiển thị
              <input value={row.name || ''} onChange={(e) => updateAt(i, { name: e.target.value })} className={fc} />
            </label>
            <label className="block text-sm text-slate-400">
              Chữ viết tắt (avatar)
              <input
                value={row.initial || ''}
                onChange={(e) => updateAt(i, { initial: e.target.value })}
                className={fc}
                placeholder="VD: MA"
                maxLength={4}
              />
            </label>
            <label className="block text-sm text-slate-400">
              Màu avatar
              <select
                value={row.color === 'purple' ? 'purple' : 'indigo'}
                onChange={(e) => updateAt(i, { color: e.target.value })}
                className={fc}
              >
                {TESTIMONIAL_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-2 block text-sm text-slate-400">
            Trích dẫn
            <textarea
              rows={3}
              value={row.quote || ''}
              onChange={(e) => updateAt(i, { quote: e.target.value })}
              className={fc}
            />
          </label>
        </div>
      ))}
      <button
        type="button"
        className={btnGhost}
        onClick={() =>
          onChange([
            ...items,
            { name: '', initial: '', quote: '', color: 'indigo' },
          ])
        }
      >
        + Thêm đánh giá
      </button>
    </div>
  )
}

export function LessonSectionBlocksEditor({ blocks, onChange, fieldClass }) {
  const fc = fieldClass || 'mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white'
  const updateAt = (i, patch) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)))
  const removeAt = (i) => onChange(blocks.filter((_, j) => j !== i))
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">Các khối nội dung (tiêu đề + đoạn)</p>
      {blocks.map((b, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex justify-end">
            <button type="button" className={btnDanger} onClick={() => removeAt(i)}>
              Xóa khối
            </button>
          </div>
          <label className="block text-sm text-slate-400">
            Tiêu đề khối
            <input value={b.heading || ''} onChange={(e) => updateAt(i, { heading: e.target.value })} className={fc} />
          </label>
          <label className="mt-2 block text-sm text-slate-400">
            Nội dung
            <textarea
              rows={4}
              value={b.body || ''}
              onChange={(e) => updateAt(i, { body: e.target.value })}
              className={fc}
            />
          </label>
        </div>
      ))}
      <button type="button" className={btnGhost} onClick={() => onChange([...blocks, { heading: '', body: '' }])}>
        + Thêm khối
      </button>
    </div>
  )
}

/** Chuỗi nhiều dòng → mảng chuỗi (bỏ dòng trống). */
export function linesToStringArray(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function stringArrayToLines(arr) {
  if (!Array.isArray(arr)) return ''
  return arr.map((x) => (typeof x === 'string' ? x : String(x))).join('\n')
}

export function normalizeLessonSections(raw) {
  if (!Array.isArray(raw)) return [{ heading: '', body: '' }]
  const out = raw.map((s) => ({
    heading: s?.heading != null ? String(s.heading) : '',
    body: s?.body != null ? String(s.body) : '',
  }))
  return out.length ? out : [{ heading: '', body: '' }]
}

export function normalizeBenefitRows(raw) {
  if (!Array.isArray(raw) || !raw.length) return []
  return raw.map((b) => ({
    icon: typeof b?.icon === 'string' ? b.icon : 'video',
    title: typeof b?.title === 'string' ? b.title : '',
    description: typeof b?.description === 'string' ? b.description : '',
  }))
}

export function normalizeTestimonialRows(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((t) => ({
    id: t?.id != null ? t.id : undefined,
    name: typeof t?.name === 'string' ? t.name : '',
    initial: typeof t?.initial === 'string' ? t.initial : '',
    quote: typeof t?.quote === 'string' ? t.quote : '',
    color: t?.color === 'purple' ? 'purple' : 'indigo',
  }))
}
