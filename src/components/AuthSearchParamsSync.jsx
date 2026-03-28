import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthModal } from '../context/AuthModalContext'

/** Mở popup khi `/?auth=login|register|forgot`. */
export default function AuthSearchParamsSync() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { openLogin, openRegister, openForgotPassword } = useAuthModal()

  useEffect(() => {
    const a = searchParams.get('auth')
    if (a === 'login') {
      openLogin()
      setSearchParams({}, { replace: true })
    } else if (a === 'register') {
      openRegister()
      setSearchParams({}, { replace: true })
    } else if (a === 'forgot') {
      openForgotPassword()
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, openLogin, openRegister, openForgotPassword, setSearchParams])

  return null
}
