import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Calendar from './Calendar.jsx'
import { Popover, PopoverContent, PopoverTrigger } from './Popover.jsx'
import { formatYmdLocal, parseYmdLocal } from '../../utils/dateYmd.js'

/**
 * @param {object} props
 * @param {string} props.value `YYYY-MM-DD` hoặc `''`
 * @param {(v: string) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {string} [props.id]
 * @param {boolean} [props.disabled]
 * @param {string} [props.triggerClassName] — thêm class cho nút (vd. nền teacher dark)
 */
export default function AppDatePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  id,
  disabled = false,
  triggerClassName = '',
}) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => {
    const d = parseYmdLocal(value)
    return d && !Number.isNaN(d.getTime()) ? d : undefined
  }, [value])

  const label = useMemo(() => {
    if (!selected) return null
    return format(selected, 'dd/MM/yyyy', { locale: vi })
  }, [selected])

  const baseTrigger =
    'inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-3 py-2.5 text-left text-sm text-gray-900 shadow-sm transition-colors hover:border-cyan-500/50 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-black/35 dark:text-white dark:shadow-none dark:hover:border-cyan-500/40'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={`${baseTrigger} ${triggerClassName}`.trim()}
        >
          <span className={label ? '' : 'text-slate-500 dark:text-slate-500'}>{label || placeholder}</span>
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
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            onChange(d ? formatYmdLocal(d) : '')
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
