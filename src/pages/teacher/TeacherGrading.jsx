import { useEffect } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { useTeacherState } from '../../hooks/useTeacherState'

export default function TeacherGrading() {
  const { state, loading, error, gradeSubmission, reopenSubmission, deleteSubmission } = useTeacherState()

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Chấm điểm</h2>
        <p className="text-sm text-slate-400">assignment_submissions — học viên nộp bài từ khu học viên.</p>
      </div>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Học sinh</th>
              <th className="px-4 py-3">Bài</th>
              <th className="px-4 py-3">Nộp lúc</th>
              <th className="px-4 py-3">Điểm</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.gradingQueue.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3">{r.studentName}</td>
                <td className="px-4 py-3 text-slate-400">{r.assignment}</td>
                <td className="px-4 py-3 text-slate-400">{r.submittedAt}</td>
                <td className="px-4 py-3">{r.status === 'graded' ? r.score : '—'}</td>
                <td className="px-4 py-3">
                  {r.status === 'pending' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        id={`score-${r.id}`}
                        type="number"
                        min={0}
                        max={10}
                        step={0.25}
                        placeholder="0–10"
                        className="w-20 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const el = document.getElementById(`score-${r.id}`)
                          const v = el?.value
                          if (v === '' || Number.isNaN(Number(v))) return
                          try {
                            await gradeSubmission(r.id, v, 'graded')
                          } catch (err) {
                            toastActionError(err, 'Không lưu được điểm.')
                          }
                        }}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Lưu điểm
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Xóa bài nộp?')) return
                          try {
                            await deleteSubmission(r.id)
                          } catch (err) {
                            toastActionError(err, 'Không xóa được bài nộp.')
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-slate-500">Đã chấm</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await reopenSubmission(r.id)
                          } catch (err) {
                            toastActionError(err, 'Không mở lại chấm được.')
                          }
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        Mở lại chấm
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
