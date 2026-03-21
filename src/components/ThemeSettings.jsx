import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

const appearanceOptions = [
  { id: 'light', label: 'Sáng', icon: '☀️' },
  { id: 'dark', label: 'Tối', icon: '🌙' },
  { id: 'system', label: 'Theo hệ thống', icon: '💻' },
]

const fontOptions = [
  { id: 'default', label: 'Mặc định' },
  { id: 'large', label: 'Lớn hơn' },
]

export default function ThemeSettings({ compact = false }) {
  const {
    appearance,
    setAppearance,
    fontSize,
    setFontSize,
    reduceMotion,
    setReduceMotion,
    resolvedMode,
  } = useTheme()

  const panelTransition = reduceMotion ? { duration: 0 } : { duration: 0.2 }

  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${
          compact ? 'md:px-2' : ''
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        title="Chế độ hiển thị"
      >
        <span className="text-lg" aria-hidden>
          {resolvedMode === 'dark' ? '🌙' : '☀️'}
        </span>
        {!compact && <span className="hidden sm:inline">Chế độ</span>}
        <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
            className={`absolute z-[60] mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-slate-600 dark:bg-slate-800 ${
              compact ? 'left-1/2 right-auto -translate-x-1/2' : 'right-0'
            }`}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Giao diện
            </p>
            <div className="flex flex-col gap-1">
              {appearanceOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAppearance(opt.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    appearance === opt.id
                      ? 'bg-cyan-50 font-medium text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="my-4 border-t border-gray-100 dark:border-slate-600" />

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Cỡ chữ
            </p>
            <div className="flex gap-2">
              {fontOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontSize(opt.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                    fontSize === opt.id
                      ? 'bg-fuchsia-50 font-medium text-fuchsia-900 dark:bg-fuchsia-950/40 dark:text-fuchsia-200'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="my-4 border-t border-gray-100 dark:border-slate-600" />

            <label className="flex cursor-pointer flex-col gap-2 rounded-lg px-1 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-700 dark:text-slate-300">
                Giảm hiệu ứng chuyển động
                <span className="mt-0.5 block text-[11px] font-normal text-gray-500 dark:text-slate-500">
                  Tắt gần hết animation (Framer Motion + chuyển trang). Bật để thấy chuyển đổi gần như tức thì.
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={reduceMotion}
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  reduceMotion ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    reduceMotion ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>

            <p className="mt-3 text-[11px] leading-snug text-gray-500 dark:text-slate-500">
              Lưu trên trình duyệt này. Chế độ “Theo hệ thống” cập nhật khi bạn đổi giao diện Windows/macOS.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
