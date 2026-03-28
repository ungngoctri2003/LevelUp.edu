import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthSessionContext = createContext(null)

/** Map DB role → role route (học viên = user) */
function routeRole(dbRole) {
  if (dbRole === 'student') return 'user'
  return dbRole
}

export function AuthSessionProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.warn('[auth] profile', error.message)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return
      setSession(s)
      if (s?.user?.id) await loadProfile(s.user.id)
      else setProfile(null)
      if (!cancelled) setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user?.id) loadProfile(s.user.id)
      else setProfile(null)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const user = useMemo(() => {
    if (!session?.user || !profile) return null
    const rr = routeRole(profile.role)
    return {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      phone: profile.phone || '',
      role: rr,
      dbRole: profile.role,
      accountStatus: profile.account_status,
    }
  }, [session, profile])

  const login = useCallback(async (email, password) => {
    setAuthError(null)
    if (!supabase) {
      setAuthError('Đăng nhập chưa khả dụng trên trang này. Vui lòng thử lại sau.')
      return { error: new Error('no supabase'), role: null }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setAuthError(error.message)
      return { error, role: null }
    }
    setSession(data.session)
    if (data.user?.id) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
      setProfile(prof || null)
      const rr = routeRole(prof?.role)
      return { error: null, role: rr }
    }
    return { error: null, role: null }
  }, [])

  const register = useCallback(async ({ email, password, fullName, phone }) => {
    setAuthError(null)
    if (!supabase) {
      setAuthError('Đăng nhập chưa khả dụng trên trang này. Vui lòng thử lại sau.')
      return { error: new Error('no supabase') }
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    })
    if (error) {
      setAuthError(error.message)
      return { error }
    }
    if (data.session && data.user?.id) {
      setSession(data.session)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
      setProfile(prof || null)
    }
    return { error: null, needsEmailConfirm: !data.session }
  }, [])

  const logout = useCallback(async () => {
    setAuthError(null)
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      if (!supabase || !profile?.id) return
      const patch = {}
      if (updates.name != null) patch.full_name = updates.name
      if (updates.phone != null) patch.phone = updates.phone
      if (Object.keys(patch).length === 0) return
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', profile.id).select().single()
      if (!error && data) setProfile(data)
    },
    [profile],
  )

  /** URL nhận link từ email (cần khai báo trong Supabase → Authentication → URL Configuration). */
  const getPasswordResetRedirectUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    return `${window.location.origin}${basePath}/dat-lai-mat-khau`
  }, [])

  const requestPasswordReset = useCallback(
    async (email) => {
      setAuthError(null)
      if (!supabase) {
        const err = new Error('Chức năng chưa sẵn sàng. Vui lòng thử lại sau.')
        setAuthError(err.message)
        return { error: err }
      }
      const redirectTo = getPasswordResetRedirectUrl()
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) setAuthError(error.message)
      return { error }
    },
    [getPasswordResetRedirectUrl],
  )

  const updatePassword = useCallback(async (password) => {
    setAuthError(null)
    if (!supabase) {
      const err = new Error('Chức năng chưa sẵn sàng. Vui lòng thử lại sau.')
      setAuthError(err.message)
      return { error: err }
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setAuthError(error.message)
    return { error }
  }, [])

  const value = useMemo(
    () => ({
      session,
      profile,
      user,
      loading,
      authError,
      setAuthError,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      requestPasswordReset,
      updatePassword,
    }),
    [
      session,
      profile,
      user,
      loading,
      authError,
      login,
      register,
      logout,
      updateProfile,
      requestPasswordReset,
      updatePassword,
    ],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext)
  if (!ctx) throw new Error('useAuthSession must be used within AuthSessionProvider')
  return ctx
}
