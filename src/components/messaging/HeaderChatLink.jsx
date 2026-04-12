import { NavLink } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useChatUnreadCount } from '../../hooks/useChatUnreadCount'

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

const variantActive = {
  admin: 'border-cyan-400/50 bg-cyan-50/90 dark:border-cyan-400/40 dark:bg-cyan-500/10',
  teacher: 'border-emerald-400/50 bg-emerald-50/90 dark:border-emerald-400/40 dark:bg-emerald-500/10',
  student: 'border-sky-400/50 bg-sky-50/90 dark:border-sky-400/40 dark:bg-sky-500/10',
}

/**
 * @param {{ to: string, variant?: 'admin' | 'teacher' | 'student' }} props
 */
export default function HeaderChatLink({ to, variant = 'admin' }) {
  const { unreadCount } = useChatUnreadCount({ variant })

  const badge =
    unreadCount > 0 ? (
      <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    ) : null

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${variantBtn[variant]} ${variantRing[variant]} ${
          isActive ? variantActive[variant] : ''
        }`
      }
      aria-label={unreadCount > 0 ? `Tin nhắn, ${unreadCount} hội thoại chưa đọc` : 'Tin nhắn'}
    >
      <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      {badge}
    </NavLink>
  )
}
