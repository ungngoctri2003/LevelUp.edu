import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE = {
  appearance: 'levelup-appearance',
  fontSize: 'levelup-font-size',
  reduceMotion: 'levelup-reduce-motion',
}

const ThemeContext = createContext(null)

function getSystemDark() {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function ThemeProvider({ children }) {
  const [appearance, setAppearanceState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE.appearance) || 'system'
    } catch {
      return 'system'
    }
  })

  const [fontSize, setFontSizeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE.fontSize) || 'default'
    } catch {
      return 'default'
    }
  })

  const [reduceMotion, setReduceMotionState] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE.reduceMotion)
      if (v === 'on') return true
      if (v === 'off') return false
    } catch {
      /* ignore */
    }
    if (typeof window === 'undefined') return false
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })

  const [systemDark, setSystemDark] = useState(getSystemDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => setSystemDark(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const resolvedMode = useMemo(() => {
    if (appearance === 'system') return systemDark ? 'dark' : 'light'
    return appearance
  }, [appearance, systemDark])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedMode === 'dark')
    root.dataset.theme = resolvedMode
  }, [resolvedMode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('text-scale-large', fontSize === 'large')
    root.dataset.fontSize = fontSize
    try {
      localStorage.setItem(STORAGE.fontSize, fontSize)
    } catch {
      /* ignore */
    }
  }, [fontSize])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('motion-reduce', reduceMotion)
    try {
      localStorage.setItem(STORAGE.reduceMotion, reduceMotion ? 'on' : 'off')
    } catch {
      /* ignore */
    }
  }, [reduceMotion])

  const setAppearance = useCallback((v) => {
    setAppearanceState(v)
    try {
      localStorage.setItem(STORAGE.appearance, v)
    } catch {
      /* ignore */
    }
  }, [])

  const setFontSize = useCallback((v) => {
    setFontSizeState(v)
  }, [])

  const setReduceMotion = useCallback((v) => {
    setReduceMotionState(v)
  }, [])

  const value = useMemo(
    () => ({
      appearance,
      resolvedMode,
      fontSize,
      reduceMotion,
      setAppearance,
      setFontSize,
      setReduceMotion,
    }),
    [
      appearance,
      resolvedMode,
      fontSize,
      reduceMotion,
      setAppearance,
      setFontSize,
      setReduceMotion,
    ],
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.appearance, appearance)
    } catch {
      /* ignore */
    }
  }, [appearance])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
