import { useEffect } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { useTeacherState } from '../../hooks/useTeacherState'
import {
  tableShell,
  tableHeadTeacher,
  tableBodyTeacher,
  tableRowHover,
} from '../../components/dashboard/dashboardStyles'
import PageLoading from '../../components/ui/PageLoading.jsx'

export default function TeacherGrading() {
  const { state, loading, error, gradeSubmission, reopenSubmission, deleteSubmission } = useTeacherState()

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chấm điểm</h2>
        <p className="text-sm text-slate-700 dark:text-slate-400">
          Danh sách bài học viên đã nộp từ trang học tập — bạn chấm điểm và phản hồi tại đây.
        </p>
      </div>

      {loading && <PageLoading variant="inline" />}

      <div className={tableShell}>
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className={tableHeadTeacher}>
            <tr>
              <th className="px-4 py-3">Học sinh</th>
              <th className="px-4 py-3">Bài</th>
              <th className="px-4 py-3">Nộp lúc</th>
              <th className="px-4 py-3">Điểm</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className={tableBodyTeacher}>
            {state.gradingQueue.map((r) => (
              <tr key={r.id} className={tableRowHover}>
                <td className="px-4 py-3">{r.studentName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.assignment}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.submittedAt}</td>
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
                        className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-white/15 dark:bg-black/30 dark:text-white"
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
