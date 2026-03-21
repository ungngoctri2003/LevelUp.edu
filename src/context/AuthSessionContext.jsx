import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'levelup-session'

const AuthSessionContext = createContext(null)

export function AuthSessionProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      /* ignore */
    }
    return null
  })

  const login = useCallback((payload) => {
    const u = {
      email: payload.email,
      name: payload.name || String(payload.email || '').split('@')[0] || 'Người dùng',
      role: payload.role,
      phone: payload.phone || '',
    }
    setUser(u)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } catch {
      /* ignore */
    }
  }, [])

  const updateProfile = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return null
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
      updateProfile,
    }),
    [user, login, logout, updateProfile],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext)
  if (!ctx) throw new Error('useAuthSession must be used within AuthSessionProvider')
  return ctx
}
