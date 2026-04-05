import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthModal } from '../context/AuthModalContext'
import { useAuthSession } from '../context/AuthSessionContext'

/** Mở popup khi `/?auth=login|register|forgot`; thông báo + đăng xuất khi `/?auth=blocked`. */
export default function AuthSearchParamsSync() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { openLogin, openRegister, openForgotPassword } = useAuthModal()
  const { logout } = useAuthSession()
  const blockedHandled = useRef(false)

  useEffect(() => {
    const a = searchParams.get('auth')
    if (a === 'blocked') {
      if (!blockedHandled.current) {
        blockedHandled.current = true
        toast.error('Tài khoản chưa kích hoạt hoặc đã bị tạm khóa. Vui lòng liên hệ trung tâm.', {
          duration: 9000,
        })
        void logout()
      }
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
      return
    }
    if (a === 'forbidden') {
      toast.error('Bạn không có quyền truy cập khu vực này.', { duration: 7000 })
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
      return
    }
    if (a === 'teacher_pending') {
      toast.warning('Tài khoản giáo viên đang chờ duyệt. Vui lòng liên hệ trung tâm.', { duration: 9000 })
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
      return
    }
    if (a === 'teacher_suspended') {
      toast.error('Tài khoản giáo viên đã bị tạm khóa. Vui lòng liên hệ trung tâm.', { duration: 9000 })
      void logout()
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
      return
    }
    blockedHandled.current = false

    if (a !== 'login' && a !== 'register' && a !== 'forgot') return

    if (a === 'login') openLogin()
    else if (a === 'register') openRegister()
    else openForgotPassword()

    const next = new URLSearchParams(searchParams)
    next.delete('auth')
    setSearchParams(next, { replace: true })
  }, [searchParams, openLogin, openRegister, openForgotPassword, setSearchParams, logout])

  return null
}
