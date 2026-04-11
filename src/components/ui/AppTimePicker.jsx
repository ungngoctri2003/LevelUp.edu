import { useEffect, useState } from 'react'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'
import './AppTimePicker.css'

/** Chuẩn hoá giờ từ react-time-picker (có thể có giây) → `HH:mm` cho form hiện tại. */
export function normalizeTimeHmString(v) {
  if (v == null || v === '') return ''
  const parts = String(v).split(':')
  const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0))
  const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0))
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Chọn giờ (24h) — react-time-picker, giao diện tách ô giờ/phút + đồng hồ tuỳ chọn.
 *
 * @param {object} props
 * @param {string} props.value `HH:mm` hoặc `''`
 * @param {(v: string) => void} props.onChange
 * @param {boolean} [props.required]
 * @param {boolean} [props.disabled]
 * @param {string} [props.id]
 * @param {'dark' | 'light'} [props.variant]
 * @param {boolean} [props.disableClock] — tắt popup đồng hồ (vd. trong modal hẹp)
 */
export default function AppTimePicker({
  value,
  onChange,
  required = false,
  disabled = false,
  id,
  variant = 'dark',
  disableClock = false,
}) {
  const [portalEl, setPortalEl] = useState(null)
  useEffect(() => {
    setPortalEl(typeof document !== 'undefined' ? document.body : null)
  }, [])

  const rootClass = variant === 'light' ? 'app-time-picker-root app-time-picker-root--light' : 'app-time-picker-root app-time-picker-root--dark'

  return (
    <div className={rootClass}>
      <TimePicker
        id={id}
        value={value && String(value).trim() ? value : null}
        onChange={(v) => onChange(v == null ? '' : normalizeTimeHmString(v))}
        format="HH:mm"
        locale="vi-VN"
        required={required}
        disabled={disabled}
        disableClock={disableClock}
        clearIcon={required ? null : undefined}
        clockAriaLabel="Mở đồng hồ chọn giờ"
        nativeInputAriaLabel="Giờ (nhập trực tiếp)"
        portalContainer={portalEl || undefined}
        className="app-time-picker-inner w-full"
      />
    </div>
  )
}
