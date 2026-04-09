import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import Navbar from '../components/sections/Navbar'
import Footer from '../components/sections/Footer'
import { useTheme } from '../context/ThemeContext'

const ease = [0.22, 1, 0.36, 1]

export default function Layout() {
  const location = useLocation()
  const { reduceMotion } = useTheme()

  const pageTransition = reduceMotion
    ? { duration: 0.01, ease: 'linear' }
    : { duration: 0.42, ease }

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <div className="app-shell flex min-h-screen flex-col bg-white transition-[background-color] duration-300 dark:bg-slate-950">
          <a
            href="#main-content"
            className="sr-only rounded-xl border border-cyan-500/50 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg outline-none ring-2 ring-cyan-500/30 transition-transform focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] dark:bg-slate-900 dark:text-white dark:ring-cyan-400/40"
          >
            Bỏ qua đến nội dung chính
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-hidden outline-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                transition={pageTransition}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
    </MotionConfig>
  )
}
