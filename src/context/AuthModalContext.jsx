import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [authView, setAuthView] = useState(null)

  const openLogin = useCallback(() => setAuthView('login'), [])
  const openRegister = useCallback(() => setAuthView('register'), [])
  const openForgotPassword = useCallback(() => setAuthView('forgot'), [])
  const closeAuth = useCallback(() => setAuthView(null), [])

  const value = useMemo(
    () => ({
      authView,
      openLogin,
      openRegister,
      openForgotPassword,
      closeAuth,
    }),
    [authView, openLogin, openRegister, openForgotPassword, closeAuth],
  )

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
