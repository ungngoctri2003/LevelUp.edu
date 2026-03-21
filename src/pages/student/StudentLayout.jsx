import ProtectedRoute from '../../components/ProtectedRoute'
import StudentShell from '../../components/student/StudentShell'

export default function StudentLayout() {
  return (
    <ProtectedRoute allowedRoles={['user']}>
      <StudentShell />
    </ProtectedRoute>
  )
}
