import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../Logo'
import { useAuthSession } from '../../context/AuthSessionContext'
import { NavIcon } from './DashboardNavIcons'

const shellGrad = {
  admin: 'from-violet-950/95 via-slate-950 to-slate-950',
  teacher: 'from-emerald-950/95 via-slate-950 to-slate-950',
}

const sidebarAccent = {
  admin: 'border-r border-white/10 bg-gradient-to-b from-violet-950/40 via-black/25 to-slate-950/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]',
  teacher:
    'border-r border-white/10 bg-gradient-to-b from-emerald-950/40 via-black/25 to-slate-950/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]',
}

const activeLink = {
  admin:
    'border-cyan-400/35 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/10 text-white shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)]',
  teacher: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-50 shadow-[0_0_20px_-4px_rgba(52,211,153,0.3)]',
}

const roleBadge = {
  admin: 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-100',
  teacher: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100',
}

export default function DashboardShell({ navItems, accent = 'admin', title }) {
  const { user, logout } = useAuthSession()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  const SidebarContent = () => (
    <>
      <div className="border-b border-white/10 p-5">
        <NavLink to="/" className="block transition-opacity hover:opacity-90" onClick={closeMobile}>
          <Logo variant="navbar" forDarkSidebar className="max-w-[168px]" />
        </NavLink>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
        <div
          className={`mt-3 h-px w-12 rounded-full ${accent === 'admin' ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500' : 'bg-gradient-to-r from-emerald-400 to-teal-400'}`}
        />
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={closeMobile}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? activeLink[accent]
                  : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <NavIcon
                  name={item.icon || 'dashboard'}
                  className={
                    isActive
                      ? accent === 'admin'
                        ? 'text-cyan-200'
                        : 'text-emerald-200'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/10 ${
              accent === 'admin'
                ? 'bg-gradient-to-br from-cyan-500 to-fuchsia-600'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}
          >
            {(user?.name || '?')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-semibold text-slate-100">{user?.name}</p>
            <p className="truncate text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/')
            closeMobile()
          }}
          className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
        >
          Đăng xuất
        </button>
        <NavLink
          to="/"
          onClick={closeMobile}
          className={`mt-2 block text-center text-sm ${accent === 'admin' ? 'text-cyan-400/90 hover:text-cyan-300' : 'text-emerald-400/90 hover:text-emerald-300'}`}
        >
          ← Về trang chủ
        </NavLink>
      </div>
    </>
  )

  return (
    <div className={`dashboard-app-bg min-h-screen bg-gradient-to-br ${shellGrad[accent]} text-slate-100`}>
      <div className="relative z-[1] flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className={`hidden w-[272px] shrink-0 flex-col backdrop-blur-xl lg:flex ${sidebarAccent[accent]}`}>
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm lg:hidden"
                aria-label="Đóng menu"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className={`fixed inset-y-0 left-0 z-[60] flex w-[min(288px,92vw)] flex-col border-r border-white/10 bg-slate-950/98 shadow-2xl backdrop-blur-xl lg:hidden ${sidebarAccent[accent]}`}
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-xl lg:px-8">
            <div className="dashboard-main-inner flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Mở menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-white lg:hidden">{title}</h1>
                  <p className="hidden text-sm text-slate-400 lg:block">
                    Xin chào, <span className="font-medium text-slate-200">{user?.name}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500 lg:hidden">{user?.email}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${roleBadge[accent]}`}
              >
                {accent === 'admin' ? 'Quản trị' : 'Giáo viên'}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
            <motion.div
              className="dashboard-main-inner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav — icon + label */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                isActive
                  ? accent === 'admin'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                  : 'text-slate-500'
              }`
            }
          >
            <NavIcon
              name={item.icon || 'dashboard'}
              className="h-4 w-4 opacity-90"
            />
            <span className="truncate px-0.5">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-slate-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Thoát
        </button>
      </nav>
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />
    </div>
  )
}
