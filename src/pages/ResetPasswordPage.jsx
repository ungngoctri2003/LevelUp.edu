import { useEffect, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuthSession } from '../context/AuthSessionContext'
import { authErrorMessageForUser } from '../lib/authErrorMessages.js'
import { toast } from 'sonner'

/**
 * Trang đặt mật khẩu mới sau khi bấm link trong email (Supabase recovery).
 * Thêm URL đầy đủ (vd. https://.../dat-lai-mat-khau) vào Supabase → Authentication → Redirect URLs.
 */
export default function ResetPasswordPage() {
  const fieldIds = useId()
  const navigate = useNavigate()
  const { updatePassword } = useAuthSession()
  const [status, setStatus] = useState('checking') // checking | form | invalid
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setStatus('invalid')
      return
    }

    let cancelled = false
    let settled = false

    const go = (next) => {
      if (cancelled || settled) return
      settled = true
      setStatus(next)
    }

    const fromHash =
      typeof window !== 'undefined' && window.location.hash.includes('type=recovery')

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') go('form')
    })

    let failTimer

    if (fromHash) {
      ;(async () => {
        for (let i = 0; i < 40; i++) {
          if (cancelled) return
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            go('form')
            return
          }
          await new Promise((r) => setTimeout(r, 100))
        }
        if (!cancelled) go('invalid')
      })()
      failTimer = setTimeout(() => {
        if (!cancelled) setStatus((s) => (s === 'checking' ? 'invalid' : s))
      }, 6000)
    } else {
      failTimer = setTimeout(() => {
        if (!cancelled) setStatus((s) => (s === 'checking' ? 'invalid' : s))
      }, 3000)
    }

    return () => {
      cancelled = true
      clearTimeout(failTimer)
      subscription.unsubscribe()
    }
  }, [])

  const validate = () => {
    const newErrors = {}
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu mới'
    else if (form.password.length < 6) newErrors.password = 'Mật khẩu tối thiểu 6 ký tự'
    if (form.password !== form.confirm) newErrors.confirm = 'Mật khẩu xác nhận không khớp'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      const { error } = await updatePassword(form.password)
      if (error) {
        toast.error(authErrorMessageForUser(error, 'updatePassword'))
        return
      }
      toast.success('Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.')
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  if (!supabase) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-slate-600 dark:text-slate-400">
        <p>Trang này chưa sẵn sàng để đặt lại mật khẩu. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.</p>
        <Link to="/" className="mt-4 inline-block text-cyan-600 dark:text-cyan-400">
          Về trang chủ
        </Link>
      </div>
    )
  }

  if (status === 'checking') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-slate-500 dark:text-slate-400">
        Đang xác nhận liên kết…
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Liên kết không hợp lệ hoặc đã hết hạn</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Vui lòng yêu cầu gửi lại email đặt lại mật khẩu từ màn hình đăng nhập.
        </p>
        <Link
          to="/?auth=forgot"
          className="mt-6 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Gửi lại email
        </Link>
        <div className="mt-4">
          <Link to="/" className="text-sm text-cyan-600 dark:text-cyan-400">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-xl text-white shadow-lg">
          ✦
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`${fieldIds}-pw`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Mật khẩu mới
          </label>
          <input
            id={`${fieldIds}-pw`}
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            autoComplete="new-password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor={`${fieldIds}-pw2`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Xác nhận mật khẩu
          </label>
          <input
            id={`${fieldIds}-pw2`}
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            autoComplete="new-password"
          />
          {errors.confirm && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirm}</p>}
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {busy ? 'Đang lưu…' : 'Cập nhật mật khẩu'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/" className="text-cyan-600 dark:text-cyan-400">
          Về trang chủ
        </Link>
      </p>
    </div>
  )
}
