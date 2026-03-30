import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTeacherState } from '../../hooks/useTeacherState'

export default function TeacherStudents() {
  const { state, loading, error } = useTeacherState()

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Học sinh</h2>
        <p className="text-sm text-slate-400">Các lớp bạn phụ trách.</p>
      </div>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Lớp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.teacherStudents.map((s) => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-slate-400">{s.email}</td>
                <td className="px-4 py-3 text-slate-400">{s.classes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
