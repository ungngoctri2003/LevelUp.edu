import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import Navbar from '../components/sections/Navbar'
import Footer from '../components/sections/Footer'
import AuthModal from '../components/AuthModal'
import AuthSearchParamsSync from '../components/AuthSearchParamsSync'
import { AuthModalProvider } from '../context/AuthModalContext'
import { useTheme } from '../context/ThemeContext'

const ease = [0.22, 1, 0.36, 1]

export default function Layout() {
  const location = useLocation()
  const { reduceMotion } = useTheme()

  const pageTransition = reduceMotion
    ? { duration: 0.01, ease: 'linear' }
    : { duration: 0.42, ease }

  return (
    <AuthModalProvider>
      <AuthSearchParamsSync />
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
        <div className="app-shell flex min-h-screen flex-col bg-white transition-[background-color] duration-300 dark:bg-slate-950">
          <Navbar />
          <main className="flex-1 overflow-x-hidden">
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
          <AuthModal />
        </div>
      </MotionConfig>
    </AuthModalProvider>
  )
}
