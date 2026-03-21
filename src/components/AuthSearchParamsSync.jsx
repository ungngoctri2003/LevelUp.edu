import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthModal } from '../context/AuthModalContext'

/** Mở popup khi vào `/?auth=login` hoặc `/?auth=register` (ví dụ từ link cũ /dang-ky). */
export default function AuthSearchParamsSync() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { openLogin, openRegister } = useAuthModal()

  useEffect(() => {
    const a = searchParams.get('auth')
    if (a === 'login') {
      openLogin()
      setSearchParams({}, { replace: true })
    } else if (a === 'register') {
      openRegister()
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, openLogin, openRegister, setSearchParams])

  return null
}
