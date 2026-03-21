import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../Logo'
import { useAuthSession } from '../../context/AuthSessionContext'

export const studentNavItems = [
  { to: '/hoc-vien', label: 'Tổng quan', end: true },
  { to: '/hoc-vien/khoa-hoc', label: 'Khóa học' },
  { to: '/hoc-vien/bai-giang', label: 'Bài giảng' },
  { to: '/hoc-vien/bai-kiem-tra', label: 'Kiểm tra' },
  { to: '/hoc-vien/ho-so', label: 'Hồ sơ' },
]

export default function StudentShell() {
  const { user, logout } = useAuthSession()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-black/25 backdrop-blur-md lg:flex">
          <div className="border-b border-white/10 p-4">
            <NavLink to="/" className="block">
              <Logo variant="navbar" className="max-w-[150px] brightness-0 invert opacity-90" />
            </NavLink>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-sky-300/80">Khu học viên</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
            {studentNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-sky-500/40 bg-sky-500/15 text-sky-200'
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
            <NavLink to="/" className="mt-2 block text-center text-sky-400 hover:text-sky-300">
              ← Về trang chủ
            </NavLink>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md lg:px-8">
            <div>
              <h1 className="text-lg font-semibold text-white lg:hidden">Học viên</h1>
              <p className="hidden text-sm text-slate-400 lg:block">
                Chúc bạn học tốt, <span className="text-slate-200">{user?.name}</span>
              </p>
            </div>
            <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs font-medium text-sky-200">Học viên</span>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 pb-20 lg:p-8 lg:pb-8">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10 bg-slate-950/95 backdrop-blur-md lg:hidden">
        {studentNavItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-[10px] font-medium ${isActive ? 'text-sky-400' : 'text-slate-500'}`
            }
          >
            {item.label.split(' ')[0]}
          </NavLink>
        ))}
        <NavLink
          to="/hoc-vien/ho-so"
          className={({ isActive }) =>
            `flex-1 py-3 text-center text-[10px] font-medium ${isActive ? 'text-sky-400' : 'text-slate-500'}`
          }
        >
          Hồ sơ
        </NavLink>
      </nav>
    </div>
  )
}
