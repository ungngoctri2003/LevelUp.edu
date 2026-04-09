/** Form thân thiện thay cho sửa JSON thô trong admin CMS / bài giảng */

import { inputAdminField, labelAdmin } from '../dashboard/dashboardStyles'

const btnGhost =
  'rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5'
const btnDanger =
  'rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10'

const fieldDefault = `mt-1 rounded-xl px-3 py-2 ${inputAdminField}`

const cardWrap =
  'rounded-xl border border-slate-300 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:ring-0'

export function LinesTextarea({ label, hint, value, onChange, rows = 6, className = '', inputClassName }) {
  const ta = inputClassName || `mt-1 rounded-xl px-3 py-2 ${inputAdminField}`
  return (
    <label className={`${labelAdmin} ${className}`}>
      {label}
      {hint && <span className="mt-0.5 block text-xs font-normal text-slate-600 dark:text-slate-500">{hint}</span>}
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
  const fc = fieldClass || fieldDefault
  const updateAt = (i, patch) => {
    onChange(items.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  const removeAt = (i) => onChange(items.filter((_, j) => j !== i))
  return (
    <div className="space-y-4">
      {items.map((row, i) => (
        <div key={i} className={cardWrap}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-500">Mục {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => removeAt(i)}>
              Xóa mục
            </button>
          </div>
          <label className={labelAdmin}>
            Biểu tượng
            <select value={row.icon || 'video'} onChange={(e) => updateAt(i, { icon: e.target.value })} className={fc}>
              {BENEFIT_ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={`mt-2 ${labelAdmin}`}>
            Tiêu đề
            <input value={row.title || ''} onChange={(e) => updateAt(i, { title: e.target.value })} className={fc} />
          </label>
          <label className={`mt-2 ${labelAdmin}`}>
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
        onClick={() => onChange([...items, { icon: 'video', title: '', description: '' }])}
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
  const fc = fieldClass || fieldDefault
  const updateAt = (i, patch) => {
    onChange(items.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  const removeAt = (i) => onChange(items.filter((_, j) => j !== i))
  return (
    <div className="space-y-4">
      {items.map((row, i) => (
        <div key={row.id != null ? `t-${row.id}` : i} className={cardWrap}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-500">Đánh giá {i + 1}</span>
            <button type="button" className={btnDanger} onClick={() => removeAt(i)}>
              Xóa
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={labelAdmin}>
              Họ tên hiển thị
              <input value={row.name || ''} onChange={(e) => updateAt(i, { name: e.target.value })} className={fc} />
            </label>
            <label className={labelAdmin}>
              Chữ viết tắt (avatar)
              <input
                value={row.initial || ''}
                onChange={(e) => updateAt(i, { initial: e.target.value })}
                className={fc}
                placeholder="VD: MA"
                maxLength={4}
              />
            </label>
            <label className={labelAdmin}>
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
          <label className={`mt-2 ${labelAdmin}`}>
            Trích dẫn
            <textarea rows={3} value={row.quote || ''} onChange={(e) => updateAt(i, { quote: e.target.value })} className={fc} />
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
  const fc = fieldClass || fieldDefault
  const updateAt = (i, patch) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)))
  const removeAt = (i) => onChange(blocks.filter((_, j) => j !== i))
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 dark:text-slate-400">Các khối nội dung (tiêu đề + đoạn)</p>
      {blocks.map((b, i) => (
        <div key={i} className={cardWrap}>
          <div className="mb-2 flex justify-end">
            <button type="button" className={btnDanger} onClick={() => removeAt(i)}>
              Xóa khối
            </button>
          </div>
          <label className={labelAdmin}>
            Tiêu đề khối
            <input value={b.heading || ''} onChange={(e) => updateAt(i, { heading: e.target.value })} className={fc} />
          </label>
          <label className={`mt-2 ${labelAdmin}`}>
            Nội dung
            <textarea rows={4} value={b.body || ''} onChange={(e) => updateAt(i, { body: e.target.value })} className={fc} />
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
