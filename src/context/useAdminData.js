import { useContext } from 'react'
import { AdminDataContext } from './AdminDataContext.jsx'

export function useAdminData() {
  const c = useContext(AdminDataContext)
  if (!c) throw new Error('useAdminData trong AdminDataProvider')
  return c
}
