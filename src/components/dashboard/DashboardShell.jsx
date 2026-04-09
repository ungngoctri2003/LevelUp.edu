import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import Logo from '../Logo'
import ThemeSettings from '../ThemeSettings'
import { useAuthSession } from '../../context/AuthSessionContext'
import { useTheme } from '../../context/ThemeContext'
import { NavIcon } from './DashboardNavIcons'

const shellGrad = {
  admin:
    'bg-slate-100 bg-gradient-to-br from-violet-50 via-slate-100 to-slate-100 text-slate-900 dark:from-violet-950/95 dark:via-slate-950 dark:to-slate-950 dark:text-slate-100',
  teacher:
    'bg-slate-100 bg-gradient-to-br from-emerald-50 via-slate-100 to-slate-100 text-slate-900 dark:from-emerald-950/95 dark:via-slate-950 dark:to-slate-950 dark:text-slate-100',
}

const sidebarAccent = {
  admin:
    'border-r border-slate-300 bg-gradient-to-b from-violet-50/90 via-white to-slate-100/95 shadow-sm dark:border-white/10 dark:from-violet-950/40 dark:via-black/25 dark:to-slate-950/80 dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]',
  teacher:
    'border-r border-slate-300 bg-gradient-to-b from-emerald-50/90 via-white to-slate-100/95 shadow-sm dark:border-white/10 dark:from-emerald-950/40 dark:via-black/25 dark:to-slate-950/80 dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]',
}

const activeLink = {
  admin:
    'border-cyan-500/35 bg-gradient-to-r from-cyan-500/15 to-fuchsia-500/10 text-slate-900 shadow-sm dark:border-cyan-400/35 dark:from-cyan-500/20 dark:to-fuchsia-500/10 dark:text-white dark:shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)]',
  teacher:
    'border-emerald-500/35 bg-emerald-500/12 text-emerald-950 shadow-sm dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-50 dark:shadow-[0_0_20px_-4px_rgba(52,211,153,0.3)]',
}

const inactiveLink =
  'border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white'

const roleBadge = {
  admin:
    'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/15 dark:text-fuchsia-100',
  teacher:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100',
}

export default function DashboardShell({ navItems, accent = 'admin', title, profileTo }) {
  const { user, logout } = useAuthSession()
  const navigate = useNavigate()
  const { reduceMotion, resolvedMode } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)
  const drawerTransition = reduceMotion ? { duration: 0.15, ease: 'linear' } : { type: 'spring', damping: 28, stiffness: 320 }
  const mainTransition = reduceMotion
    ? { duration: 0.01, ease: 'linear' }
    : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

  const SidebarContent = () => (
    <>
      <div className="border-b border-slate-300 p-5 dark:border-white/10">
        <NavLink to="/" className="block transition-opacity hover:opacity-90" onClick={closeMobile}>
          <Logo variant="navbar" forDarkSidebar={resolvedMode === 'dark'} className="max-w-[168px]" />
        </NavLink>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">{title}</p>
        <div
          className={`mt-3 h-px w-12 rounded-full ${accent === 'admin' ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500' : 'bg-gradient-to-r from-emerald-400 to-teal-400'}`}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive ? activeLink[accent] : inactiveLink
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
                            ? 'text-cyan-700 dark:text-cyan-200'
                            : 'text-emerald-800 dark:text-emerald-200'
                          : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-300 p-4 dark:border-white/10">
            <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white/90 p-3 dark:border-white/10 dark:bg-black/30">
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
                <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="truncate text-slate-500 dark:text-slate-500">{user?.email}</p>
              </div>
            </div>
            <NavLink
              to="/"
              onClick={closeMobile}
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              ← Về trang chủ
            </NavLink>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/')
                closeMobile()
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <div className={`dashboard-app-bg min-h-screen bg-gradient-to-br ${shellGrad[accent]}`}>
        <div className="relative z-[1] flex min-h-screen">
          <aside
            className={`hidden min-h-0 w-[272px] shrink-0 flex-col backdrop-blur-xl lg:flex ${sidebarAccent[accent]}`}
          >
            <SidebarContent />
          </aside>

          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reduceMotion ? { duration: 0.01 } : undefined}
                  className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm dark:bg-black/65 lg:hidden"
                  aria-label="Đóng menu"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={drawerTransition}
                  className={`fixed inset-y-0 left-0 z-[60] flex min-h-0 w-[min(288px,92vw)] flex-col border-r border-slate-300 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/98 lg:hidden ${sidebarAccent[accent]}`}
                >
                  <SidebarContent />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 border-b border-slate-300 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 lg:px-8">
              <div className="dashboard-main-inner flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white lg:hidden"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Mở menu"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </button>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white lg:hidden">{title}</h1>
                    <p className="hidden text-sm text-slate-600 dark:text-slate-400 lg:block">
                      Xin chào, <span className="font-medium text-slate-800 dark:text-slate-200">{user?.name}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-500 lg:hidden">{user?.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ThemeSettings compact />
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${roleBadge[accent]}`}>
                    {accent === 'admin' ? 'Quản trị' : 'Giáo viên'}
                  </span>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-x-hidden px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
              <motion.div
                className="dashboard-main-inner"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={mainTransition}
              >
                <Outlet />
              </motion.div>
            </main>
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-300 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
          {(profileTo ? navItems.slice(0, 3) : navItems.slice(0, 4)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  isActive
                    ? accent === 'admin'
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-500'
                }`
              }
            >
              <NavIcon name={item.icon || 'dashboard'} className="h-4 w-4 opacity-90" />
              <span className="truncate px-0.5">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
          {profileTo && (
            <NavLink
              to={profileTo}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  isActive
                    ? accent === 'admin'
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-500'
                }`
              }
            >
              <NavIcon name="profile" className="h-4 w-4 opacity-90" />
              Hồ sơ
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-slate-500 dark:text-slate-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Thoát
          </button>
        </nav>
        <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />
      </div>
    </MotionConfig>
  )
}
