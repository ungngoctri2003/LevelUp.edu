import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '../context/AuthSessionContext'

/** Chặn giáo viên chưa duyệt / bị khóa khỏi toàn bộ /giao-vien (sau ProtectedRoute). */
export default function TeacherApprovalGate({ children }) {
  const { user, loading } = useAuthSession()
  const location = useLocation()
  const next = encodeURIComponent(`${location.pathname}${location.search || ''}`)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        Đang xác thực…
      </div>
    )
  }

  if (!user || user.role !== 'teacher') return children

  if (user.teacherApprovalStatus === 'approved') return children

  if (user.teacherApprovalStatus === 'suspended') {
    return <Navigate to={`/?auth=teacher_suspended&next=${next}`} replace />
  }

  return <Navigate to={`/?auth=teacher_pending&next=${next}`} replace />
}
