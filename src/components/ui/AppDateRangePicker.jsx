import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Calendar from './Calendar.jsx'
import { Popover, PopoverContent, PopoverTrigger } from './Popover.jsx'
import { formatYmdLocal, parseYmdLocal } from '../../utils/dateYmd.js'

/**
 * @param {object} props
 * @param {string} props.from `YYYY-MM-DD` hoặc `''`
 * @param {string} props.to `YYYY-MM-DD` hoặc `''`
 * @param {(r: { from: string, to: string }) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {boolean} [props.showClear]
 * @param {string} [props.triggerClassName]
 */
export default function AppDateRangePicker({
  from: fromStr,
  to: toStr,
  onChange,
  placeholder = 'Chọn khoảng ngày',
  showClear = true,
  triggerClassName = '',
}) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => {
    const from = parseYmdLocal(fromStr)
    if (!from) return undefined
    const to = parseYmdLocal(toStr)
    return { from, to: to ?? undefined }
  }, [fromStr, toStr])

  const summary = useMemo(() => {
    if (!fromStr?.trim()) return null
    const a = parseYmdLocal(fromStr)
    if (!a) return null
    const left = format(a, 'dd/MM/yyyy', { locale: vi })
    if (!toStr?.trim()) return `${left} — …`
    const b = parseYmdLocal(toStr)
    if (!b) return `${left} — …`
    return `${left} — ${format(b, 'dd/MM/yyyy', { locale: vi })}`
  }, [fromStr, toStr])

  const defaultMonth = selected?.from ?? new Date()

  const baseTrigger =
    'inline-flex min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-3 py-2.5 text-left text-sm text-gray-900 shadow-sm transition-colors hover:border-cyan-500/50 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-white/15 dark:bg-black/35 dark:text-white dark:shadow-none dark:hover:border-cyan-500/40'

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
        }}
      >
        <PopoverTrigger asChild>
          <button type="button" className={`${baseTrigger} ${triggerClassName}`.trim()}>
            <span className={summary ? '' : 'text-slate-500 dark:text-slate-500'}>{summary || placeholder}</span>
            <span className="text-slate-400 dark:text-slate-500" aria-hidden>
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-2">
          <Calendar
            mode="range"
            selected={selected}
            defaultMonth={defaultMonth}
            onSelect={(range) => {
              if (!range?.from) {
                onChange({ from: '', to: '' })
                return
              }
              const from = formatYmdLocal(range.from)
              const to = range.to ? formatYmdLocal(range.to) : ''
              onChange({ from, to })
              if (range.to) setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {showClear && (fromStr || toStr) ? (
        <button
          type="button"
          onClick={() => onChange({ from: '', to: '' })}
          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/10"
        >
          Xóa lọc ngày
        </button>
      ) : null}
    </div>
  )
}
