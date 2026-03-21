import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthModal } from '../context/AuthModalContext'
import { useAuthSession } from '../context/AuthSessionContext'
import { demoLoginAccounts, DEMO_PASSWORD } from '../data/demoAccounts'
import { registerStudentFromSignup } from '../utils/adminStorage'

const ROLES = [
  { value: 'user', label: 'Học viên' },
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'admin', label: 'Quản trị viên' },
]

function LoginForm({ onSwitchToRegister, onSuccess, titleId }) {
  const fieldIds = useId()
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'user',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email không hợp lệ'
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    console.log('Login:', form)
    onSuccess({ email: form.email.trim(), role: form.role })
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
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Chọn loại tài khoản và đăng nhập</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Loại tài khoản</label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
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
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${fieldIds}-email-err` : undefined}
          />
          {errors.email && (
            <p id={`${fieldIds}-email-err`} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Mật khẩu</label>
          <input
            id={`${fieldIds}-password`}
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? `${fieldIds}-password-err` : undefined}
          />
          {errors.password && (
            <p id={`${fieldIds}-password-err`} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.password}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:from-cyan-600 hover:to-fuchsia-700"
        >
          Đăng nhập
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-dashed border-cyan-500/35 bg-cyan-500/5 p-3 dark:border-cyan-500/25 dark:bg-cyan-950/40">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
          Tài khoản thử nhanh
        </p>
        <p className="mt-1 text-center text-[11px] text-slate-600 dark:text-slate-400">
          Mật khẩu chung:{' '}
          <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-cyan-800 dark:bg-slate-800 dark:text-cyan-200">
            {DEMO_PASSWORD}
          </code>
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {demoLoginAccounts.map((acc) => (
            <div key={acc.id} className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[140px]">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    email: acc.email,
                    password: acc.password,
                    role: acc.role,
                  })
                  setErrors({})
                }}
                className="w-full rounded-lg border border-cyan-500/30 bg-white/90 px-2 py-2 text-left text-xs font-medium text-cyan-900 transition-colors hover:bg-cyan-50 dark:border-cyan-500/20 dark:bg-slate-800/80 dark:text-cyan-100 dark:hover:bg-slate-700"
              >
                <span className="block font-semibold">{acc.label}</span>
                <span className="block truncate text-[10px] font-normal text-slate-500 dark:text-slate-400">{acc.email}</span>
              </button>
              <button
                type="button"
                onClick={() => onSuccess({ email: acc.email, role: acc.role, name: acc.name })}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500/90 to-fuchsia-600/90 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:from-cyan-600 hover:to-fuchsia-700"
              >
                Đăng nhập luôn →
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-gray-600 dark:text-slate-400">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-cyan-600 hover:text-fuchsia-600 dark:text-cyan-400 dark:hover:text-fuchsia-400"
        >
          Đăng ký ngay
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
    role: 'user',
  })
  const [errors, setErrors] = useState({})

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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    console.log('Register:', form)
    onSuccess({
      email: form.email.trim(),
      role: form.role,
      name: form.fullName.trim(),
      phone: form.phone.trim(),
      fromRegister: true,
    })
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-cyan-600 text-xl text-white shadow-lg">
          +
        </div>
        <h2 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white">
          Đăng ký tài khoản
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Chọn quyền và điền thông tin đăng ký</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Loại tài khoản (Quyền)</label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Họ và tên</label>
          <input
            id={`${fieldIds}-fullname`}
            type="text"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            data-auth-autofocus
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? `${fieldIds}-fullname-err` : undefined}
          />
          {errors.fullName && (
            <p id={`${fieldIds}-fullname-err`} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.fullName}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="email@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Số điện thoại</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="0901234567"
            autoComplete="tel"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Mật khẩu</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Xác nhận mật khẩu</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 hover:from-cyan-600 hover:to-fuchsia-700"
        >
          Đăng ký
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600 dark:text-slate-400">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-cyan-600 hover:text-fuchsia-600 dark:text-cyan-400 dark:hover:text-fuchsia-400"
        >
          Đăng nhập
        </button>
      </p>
    </>
  )
}

export default function AuthModal() {
  const { authView, openLogin, openRegister, closeAuth } = useAuthModal()
  const { login } = useAuthSession()
  const navigate = useNavigate()
  const titleId = useId()

  const handleAuthSuccess = (payload) => {
    const { fromRegister, ...sessionPayload } = payload
    if (fromRegister && sessionPayload.role === 'user') {
      registerStudentFromSignup({
        email: sessionPayload.email,
        name: sessionPayload.name,
        phone: sessionPayload.phone,
        role: sessionPayload.role,
      })
    }
    login(sessionPayload)
    closeAuth()
    if (payload.role === 'admin') navigate('/admin', { replace: true })
    else if (payload.role === 'teacher') navigate('/giao-vien', { replace: true })
    else navigate('/hoc-vien', { replace: true })
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
    if (!authView) return
    const id = window.requestAnimationFrame(() => {
      document.querySelector('[data-auth-autofocus]')?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [authView])

  const node =
    typeof document !== 'undefined' ? document.body : null

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
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={closeAuth}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-800"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeAuth}
              className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label="Đóng hộp thoại"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {authView === 'login' ? (
              <LoginForm titleId={titleId} onSwitchToRegister={openRegister} onSuccess={handleAuthSuccess} />
            ) : (
              <RegisterForm titleId={titleId} onSwitchToLogin={openLogin} onSuccess={handleAuthSuccess} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    node,
  )
}
