import { DayPicker } from 'react-day-picker'
import { vi } from 'date-fns/locale'

/**
 * Lịch dùng chung — style từ `react-day-picker/style.css` + biến trong index.css.
 */
export default function Calendar({ className = '', ...props }) {
  return (
    <DayPicker
      locale={vi}
      showOutsideDays
      className={`text-slate-900 dark:text-slate-100 ${className}`.trim()}
      {...props}
    />
  )
}
