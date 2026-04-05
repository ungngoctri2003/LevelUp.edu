import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '../context/AuthSessionContext'

/** Chỉ `active` (hoặc chưa có trường trên profile cũ) được vào khu vực bảo vệ. */
function mayAccessProtectedDashboard(accountStatus) {
  if (accountStatus == null || accountStatus === '') return true
  return accountStatus === 'active'
}

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {('admin'|'teacher'|'user')[]} [props.allowedRoles]
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuthSession()
  const location = useLocation()
  const nextTarget = `${location.pathname}${location.search || ''}`

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        Đang xác thực…
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/?auth=login&next=${encodeURIComponent(nextTarget)}`} replace />
  }

  if (!mayAccessProtectedDashboard(user.accountStatus)) {
    return <Navigate to="/?auth=blocked" replace />
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/?auth=forbidden" replace />
  }

  return children
}
