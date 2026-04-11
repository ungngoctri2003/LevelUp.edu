import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTeacherState } from '../../hooks/useTeacherState'
import {
  tableShell,
  tableHeadTeacher,
  tableBodyTeacher,
  tableRowHover,
} from '../../components/dashboard/dashboardStyles'
import PageLoading from '../../components/ui/PageLoading.jsx'

export default function TeacherStudents() {
  const { state, loading, error } = useTeacherState()

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Học sinh</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Các lớp bạn phụ trách.</p>
      </div>

      {loading && <PageLoading variant="inline" />}

      <div className={tableShell}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHeadTeacher}>
            <tr>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Lớp</th>
            </tr>
          </thead>
          <tbody className={tableBodyTeacher}>
            {state.teacherStudents.map((s) => (
              <tr key={s.id} className={tableRowHover}>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.email}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.classes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
