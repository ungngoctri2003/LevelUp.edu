import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '../context/AuthSessionContext'

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {('admin'|'teacher'|'user')[]} [props.allowedRoles]
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuthSession()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        Đang xác thực…
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/?auth=login&next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
