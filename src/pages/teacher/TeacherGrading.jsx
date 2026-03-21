import { useState } from 'react'
import { mockGradingQueue } from '../../data/dashboardData'

export default function TeacherGrading() {
  const [rows, setRows] = useState(mockGradingQueue)

  const grade = (id, score) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'graded', score: Number(score) } : r,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Chấm điểm</h2>
        <p className="text-sm text-slate-400">Hàng đợi bài nộp cần xử lý.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px] text-left text-sm">
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
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3">{r.studentName}</td>
                <td className="px-4 py-3 text-slate-400">{r.assignment}</td>
                <td className="px-4 py-3 text-slate-400">{r.submittedAt}</td>
                <td className="px-4 py-3">{r.status === 'graded' ? r.score : '—'}</td>
                <td className="px-4 py-3">
                  {r.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.25}
                        placeholder="0–10"
                        className="w-20 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white"
                        id={`score-${r.id}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`score-${r.id}`)
                          const v = el?.value
                          if (v === '' || Number.isNaN(Number(v))) return
                          grade(r.id, v)
                        }}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Đã chấm</span>
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
