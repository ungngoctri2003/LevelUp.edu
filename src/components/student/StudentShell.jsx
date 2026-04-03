import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../Logo'
import { useAuthSession } from '../../context/AuthSessionContext'
import { NavIcon } from '../dashboard/DashboardNavIcons'

export const studentNavItems = [
  { to: '/hoc-vien', label: 'Tổng quan', end: true, icon: 'dashboard' },
  { to: '/hoc-vien/khoa-hoc', label: 'Khóa học', icon: 'course' },
  { to: '/hoc-vien/bai-giang', label: 'Bài giảng', icon: 'lesson' },
  { to: '/hoc-vien/bai-tap', label: 'Bài tập', icon: 'assignment' },
  { to: '/hoc-vien/bai-kiem-tra', label: 'Kiểm tra', icon: 'test' },
  { to: '/hoc-vien/ho-so', label: 'Hồ sơ', icon: 'profile' },
]

const activeStudent = 'border-sky-400/40 bg-gradient-to-r from-sky-500/20 to-cyan-500/10 text-white shadow-[0_0_24px_-4px_rgba(56,189,248,0.35)]'

export default function StudentShell() {
  const { user, logout } = useAuthSession()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)

  const SidebarContent = () => (
    <>
      <div className="border-b border-white/10 p-5">
        <NavLink to="/" className="block transition-opacity hover:opacity-90" onClick={closeMobile}>
          <Logo variant="navbar" forDarkSidebar className="max-w-[160px]" />
        </NavLink>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/70">Khu học viên</p>
        <div className="mt-3 h-px w-12 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-1 p-3">
            {studentNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? activeStudent
                      : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <NavIcon
                      name={item.icon}
                      className={isActive ? 'text-sky-200' : 'text-slate-500 group-hover:text-slate-300'}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-bold text-white ring-2 ring-white/10">
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
              className="mt-2 block text-center text-sm text-sky-400/90 hover:text-sky-300"
            >
              ← Về trang chủ
            </NavLink>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="dashboard-app-bg min-h-screen bg-gradient-to-br from-sky-950/95 via-slate-950 to-slate-950 text-slate-100">
      <div className="relative z-[1] flex min-h-screen">
        <aside className="hidden min-h-0 w-[272px] shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-sky-950/35 via-black/25 to-slate-950/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl lg:flex">
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
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm lg:hidden"
                aria-label="Đóng menu"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="fixed inset-y-0 left-0 z-[60] flex min-h-0 w-[min(288px,92vw)] flex-col border-r border-white/10 bg-slate-950/98 shadow-2xl backdrop-blur-xl lg:hidden"
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
                  <h1 className="truncate text-base font-semibold text-white lg:hidden">Học viên</h1>
                  <p className="hidden text-sm text-slate-400 lg:block">
                    Chúc bạn học tốt, <span className="font-medium text-slate-200">{user?.name}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500 lg:hidden">{user?.email}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-sky-100">
                Học viên
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {studentNavItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                isActive ? 'text-sky-400' : 'text-slate-500'
              }`
            }
          >
            <NavIcon name={item.icon} className="h-4 w-4 opacity-90" />
            <span className="truncate px-0.5">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
        <NavLink
          to="/hoc-vien/ho-so"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive ? 'text-sky-400' : 'text-slate-500'
            }`
          }
        >
          <NavIcon name="profile" className="h-4 w-4 opacity-90" />
          Hồ sơ
        </NavLink>
      </nav>
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />
    </div>
  )
}
