import { useCallback, useEffect, useState } from 'react'

/**
 * Trạng thái mở/đóng sidebar desktop (lg+), nhớ theo khóa localStorage.
 */
export function usePersistedSidebarOpen(storageKey, defaultOpen = true) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw === null) return defaultOpen
      return raw === '1'
    } catch {
      return defaultOpen
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, open ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [storageKey, open])

  const toggle = useCallback(() => setOpen((o) => !o), [])

  return [open, setOpen, toggle]
}
