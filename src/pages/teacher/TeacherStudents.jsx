import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthSession } from '../../context/AuthSessionContext'
import { supabase } from '../../lib/supabaseClient'
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
  const { user } = useAuthSession()
  const navigate = useNavigate()
  const [dmFor, setDmFor] = useState(null)

  const openDm = async (studentId) => {
    if (!supabase || !user?.id) return
    setDmFor(studentId)
    try {
      const { data, error: rpcErr } = await supabase.rpc('ensure_direct_thread', {
        p_other_user: studentId,
      })
      if (rpcErr) throw rpcErr
      navigate(`/giao-vien/tin-nhan/dm/${data}`)
    } catch (e) {
      toast.error(e?.message || 'Không mở được tin nhắn')
    } finally {
      setDmFor(null)
    }
  }

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
              <th className="px-4 py-3">Tin nhắn</th>
            </tr>
          </thead>
          <tbody className={tableBodyTeacher}>
            {state.teacherStudents.map((s) => (
              <tr key={s.id} className={tableRowHover}>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.email}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.classes.join(', ')}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={dmFor === s.id}
                    onClick={() => openDm(s.id)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50 dark:text-emerald-400"
                  >
                    {dmFor === s.id ? 'Đang mở…' : 'Nhắn tin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
