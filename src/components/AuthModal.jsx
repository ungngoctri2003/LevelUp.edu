import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthModal } from '../context/AuthModalContext'
import { useAuthSession } from '../context/AuthSessionContext'

function LoginForm({ onSwitchToRegister, onSuccess, titleId }) {
  const fieldIds = useId()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email không hợp lệ'
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      await onSuccess({ email: form.email.trim(), password: form.password })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-xl text-white shadow-lg">
          ✦
        </div>
        <h2 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white">
          Đăng nhập
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Dùng tài khoản Supabase Auth. Vai trò lấy từ bảng profiles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
          <input
            id={`${fieldIds}-email`}
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="email@example.com"
            autoComplete="email"
            data-auth-autofocus
          />
          {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Mật khẩu</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            autoComplete="current-password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600 dark:text-slate-400">
        Chưa có tài khoản?{' '}
        <button type="button" onClick={onSwitchToRegister} className="font-medium text-cyan-600 dark:text-cyan-400">
          Đăng ký học viên
        </button>
      </p>
    </>
  )
}

function RegisterForm({ onSwitchToLogin, onSuccess, titleId }) {
  const fieldIds = useId()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên'
    if (!form.email.trim()) newErrors.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email không hợp lệ'
    if (!form.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại'
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu'
    else if (form.password.length < 6) newErrors.password = 'Mật khẩu tối thiểu 6 ký tự'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      await onSuccess({
        email: form.email.trim(),
        password: form.password,
        name: form.fullName.trim(),
        phone: form.phone.trim(),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white">
          Đăng ký học viên
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Tài khoản mới có role <strong>student</strong> (trigger CSDL). Giáo viên / admin do quản trị tạo trong Supabase.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Họ và tên</label>
          <input
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            data-auth-autofocus
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Số điện thoại</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Mật khẩu</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Xác nhận mật khẩu</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Đang xử lý…' : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600 dark:text-slate-400">
        Đã có tài khoản?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-cyan-600 dark:text-cyan-400">
          Đăng nhập
        </button>
      </p>
    </>
  )
}

export default function AuthModal() {
  const { authView, openLogin, openRegister, closeAuth } = useAuthModal()
  const { login, register } = useAuthSession()
  const navigate = useNavigate()
  const titleId = useId()
  const [msg, setMsg] = useState(null)

  const redirectForRole = (role) => {
    if (role === 'admin') navigate('/admin', { replace: true })
    else if (role === 'teacher') navigate('/giao-vien', { replace: true })
    else navigate('/hoc-vien', { replace: true })
  }

  const handleLogin = async ({ email, password }) => {
    setMsg(null)
    const { error, role } = await login(email, password)
    if (error) {
      setMsg(error.message || 'Đăng nhập thất bại')
      return
    }
    closeAuth()
    redirectForRole(role || 'user')
  }

  const handleRegister = async ({ email, password, name, phone }) => {
    setMsg(null)
    const { error, needsEmailConfirm } = await register({ email, password, fullName: name, phone })
    if (error) {
      setMsg(error.message || 'Đăng ký thất bại')
      return
    }
    if (needsEmailConfirm) {
      setMsg('Đã gửi email xác nhận. Vui lòng mở link trong hộp thư rồi đăng nhập.')
      return
    }
    closeAuth()
    redirectForRole('user')
  }

  useEffect(() => {
    if (!authView) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') closeAuth()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [authView, closeAuth])

  useEffect(() => {
    setMsg(null)
  }, [authView])

  const node = typeof document !== 'undefined' ? document.body : null
  if (!node) return null

  return createPortal(
    <AnimatePresence>
      {authView && (
        <motion.div
          role="presentation"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-label="Đóng" onClick={closeAuth} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-800"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeAuth}
              className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
              aria-label="Đóng"
            >
              ✕
            </button>
            {msg && <p className="mb-4 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">{msg}</p>}
            {authView === 'login' ? (
              <LoginForm titleId={titleId} onSwitchToRegister={openRegister} onSuccess={handleLogin} />
            ) : (
              <RegisterForm titleId={titleId} onSwitchToLogin={openLogin} onSuccess={handleRegister} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    node,
  )
}
