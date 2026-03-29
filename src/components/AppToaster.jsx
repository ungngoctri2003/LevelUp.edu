import { Toaster } from 'sonner'
import { useTheme } from '../context/ThemeContext.jsx'

/**
 * Toast toàn app — đặt trong ThemeProvider để khớp sáng/tối.
 */
export default function AppToaster() {
  const { resolvedMode } = useTheme()
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={4000}
      theme={resolvedMode === 'dark' ? 'dark' : 'light'}
      style={{ zIndex: 9999 }}
      className="toaster-root"
      toastOptions={{
        classNames: {
          toast: 'font-sans text-[0.9375rem] leading-snug',
        },
      }}
    />
  )
}
