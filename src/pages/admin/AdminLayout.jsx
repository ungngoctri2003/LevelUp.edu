import DashboardShell from '../../components/dashboard/DashboardShell'
import ProtectedRoute from '../../components/ProtectedRoute'
import { AdminDataProvider } from '../../context/AdminDataContext.jsx'
import { adminNavItems } from './adminNavConfig.js'

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDataProvider>
        <DashboardShell
          navItems={adminNavItems}
          title="Khu vực quản trị"
          accent="admin"
          profileTo="/admin/ho-so"
        />
      </AdminDataProvider>
    </ProtectedRoute>
  )
}
