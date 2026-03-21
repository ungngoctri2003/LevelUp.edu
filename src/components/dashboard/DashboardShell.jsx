import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../Logo'
import { useAuthSession } from '../../context/AuthSessionContext'

const shellGrad = {
  admin: 'from-violet-950 via-slate-900 to-slate-950',
  teacher: 'from-emerald-950 via-slate-900 to-slate-950',
}

const activeLink = {
  admin: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  teacher: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
}

export default function DashboardShell({ navItems, accent = 'admin', title }) {
  const { user, logout } = useAuthSession()
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen bg-gradient-to-br ${shellGrad[accent]} text-slate-100`}>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/20 backdrop-blur-md lg:flex">
          <div className="border-b border-white/10 p-4">
            <NavLink to="/" className="block">
              <Logo variant="navbar" forDarkSidebar className="max-w-[160px]" />
            </NavLink>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? activeLink[accent]
                      : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4 text-xs text-slate-400">
            <p className="truncate font-medium text-slate-200">{user?.name}</p>
            <p className="truncate">{user?.email}</p>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="mt-3 w-full rounded-lg border border-white/20 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
            >
              Đăng xuất
            </button>
            <NavLink to="/" className="mt-2 block text-center text-cyan-400 hover:text-cyan-300">
              ← Về trang chủ
            </NavLink>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md lg:px-8">
            <div>
              <h1 className="text-lg font-semibold text-white lg:hidden">{title}</h1>
              <p className="hidden text-sm text-slate-400 lg:block">
                Xin chào, <span className="text-slate-200">{user?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  accent === 'admin' ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'bg-emerald-500/20 text-emerald-200'
                }`}
              >
                {accent === 'admin' ? 'Admin' : 'Giáo viên'}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 lg:p-8">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10 bg-slate-950/95 backdrop-blur-md lg:hidden">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-[11px] font-medium ${
                isActive
                  ? accent === 'admin'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                  : 'text-slate-500'
              }`
            }
          >
            {item.label.split(' ')[0]}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="flex-1 py-3 text-center text-[11px] font-medium text-slate-500"
        >
          Thoát
        </button>
      </nav>
      <div className="h-14 lg:hidden" aria-hidden />
    </div>
  )
}
