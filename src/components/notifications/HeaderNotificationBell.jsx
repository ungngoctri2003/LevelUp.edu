import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover.jsx'
import { useUserNotifications } from '../../hooks/useUserNotifications'

const variantBtn = {
  admin:
    'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
  teacher:
    'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
  student:
    'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
}

const variantRing = {
  admin: 'focus-visible:ring-cyan-500/40',
  teacher: 'focus-visible:ring-emerald-500/40',
  student: 'focus-visible:ring-sky-500/40',
}

function relTime(iso) {
  if (!iso) return ''
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: vi })
  } catch {
    return ''
  }
}

/**
 * @param {{ variant?: 'admin' | 'teacher' | 'student' }} props
 */
export default function HeaderNotificationBell({ variant = 'admin' }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { items, loading, error, unreadCount, markRead, markAllRead } = useUserNotifications()

  const badge =
    unreadCount > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    ) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${variantBtn[variant]} ${variantRing[variant]}`}
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-0" sideOffset={10}>
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Thông báo</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-xs font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              Đánh dấu đã đọc
            </button>
          ) : null}
        </div>
        <div
          className={
            !loading && !error && items.length > 5
              ? 'max-h-[min(70vh,22.5rem)] overflow-y-auto overscroll-contain'
              : undefined
          }
        >
          {loading && <p className="px-3 py-6 text-center text-sm text-slate-500">Đang tải…</p>}
          {!loading && error && <p className="px-3 py-6 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Chưa có thông báo</p>
          )}
          {!loading &&
            !error &&
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={async () => {
                  await markRead(n.id)
                  if (n.link_path && String(n.link_path).trim()) {
                    navigate(String(n.link_path).trim())
                    setOpen(false)
                  }
                }}
                className={`flex w-full flex-col gap-0.5 border-b border-slate-100 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/4 ${
                  !n.read_at ? 'bg-cyan-50/50 dark:bg-cyan-500/5' : ''
                }`}
              >
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</span>
                {n.body ? <span className="text-xs text-slate-600 dark:text-slate-400">{n.body}</span> : null}
                <span className="text-[11px] text-slate-400">{relTime(n.created_at)}</span>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
