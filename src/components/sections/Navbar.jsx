import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../Logo'
import ThemeSettings from '../ThemeSettings'
import { useAuthModal } from '../../context/AuthModalContext'
import { useAuthSession } from '../../context/AuthSessionContext'

const menuItems = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Khóa học', path: '/bai-giang' },
  { label: 'Lớp học', path: '/lop-hoc' },
  { label: 'Tin tức', path: '/tin-tuc' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { openRegister, openLogin } = useAuthModal()
  const { user, logout } = useAuthSession()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const headerBg = scrolled
    ? 'bg-white/90 shadow-lg shadow-violet-900/10 dark:bg-slate-900/95 dark:shadow-black/40'
    : 'bg-white/85 shadow-sm dark:bg-slate-900/90 dark:shadow-black/20'

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 w-full backdrop-blur-md transition-shadow duration-300 ${headerBg}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/"
            className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            <Logo variant="navbar" className="max-w-[min(200px,55vw)]" />
          </Link>
        </motion.div>

        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`group relative inline-block py-2 text-gray-700 transition-colors hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 ${
                  isActive ? 'font-semibold text-cyan-600 dark:text-cyan-400' : ''
                }`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all duration-300 ${
                    isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-40'
                  }`}
                />
              </Link>
            )
          })}
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                >
                  Quản trị
                </Link>
              )}
              {user.role === 'teacher' && (
                <Link
                  to="/giao-vien"
                  className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
                >
                  Khu giáo viên
                </Link>
              )}
              {user.role === 'user' && (
                <Link
                  to="/hoc-vien"
                  className="text-sm font-medium text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400"
                >
                  Khu học viên
                </Link>
              )}
              <span className="hidden max-w-[120px] truncate text-sm text-gray-600 dark:text-slate-400 lg:inline" title={user.email}>
                {user.name}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openLogin}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Đăng nhập
              </button>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <button
                  type="button"
                  onClick={openRegister}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-5 py-2.5 font-medium text-white shadow-md shadow-fuchsia-500/25 transition-all duration-300 hover:from-cyan-600 hover:to-fuchsia-700 hover:shadow-lg"
                >
                  Đăng ký
                </button>
              </motion.div>
            </div>
          )}
          <ThemeSettings />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeSettings compact />
          <button
            type="button"
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            <motion.svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.25 }}
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </motion.svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/98 md:hidden"
          >
            <div className="px-6 py-4">
              <motion.div
                initial="closed"
                animate="open"
                variants={{
                  open: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
                }}
                className="flex flex-col gap-3"
              >
                {menuItems.map((item) => (
                  <motion.div
                    key={item.label}
                    variants={{
                      closed: { opacity: 0, x: -12 },
                      open: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <Link
                      to={item.path}
                      className={`block py-2 text-gray-700 transition-colors hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400 ${
                        location.pathname === item.path ? 'font-semibold text-cyan-600 dark:text-cyan-400' : ''
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 border-t border-gray-100 pt-4 dark:border-slate-700"
              >
                {user ? (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-gray-600 dark:text-slate-400">{user.name}</p>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full rounded-xl border border-violet-300 py-3 text-center text-sm font-medium text-violet-700 dark:border-fuchsia-500/40 dark:text-fuchsia-300"
                      >
                        Vào quản trị
                      </Link>
                    )}
                    {user.role === 'teacher' && (
                      <Link
                        to="/giao-vien"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full rounded-xl border border-emerald-400/50 py-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        Khu giáo viên
                      </Link>
                    )}
                    {user.role === 'user' && (
                      <Link
                        to="/hoc-vien"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full rounded-xl border border-sky-400/50 py-3 text-center text-sm font-medium text-sky-700 dark:text-sky-300"
                      >
                        Khu học viên
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full rounded-xl border border-gray-300 py-3 text-center text-sm font-medium text-gray-800 dark:border-slate-600 dark:text-slate-200"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        openLogin()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full rounded-xl border border-gray-300 py-3 text-center text-sm font-semibold text-gray-800 dark:border-slate-600 dark:text-slate-100"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openRegister()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 text-center font-medium text-white shadow-md transition-opacity hover:opacity-95"
                    >
                      Đăng ký
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
