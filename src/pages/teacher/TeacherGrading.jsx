import { useState } from 'react'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { studentName: '', assignment: '', submittedAt: '' }

export default function TeacherGrading() {
  const { state, update } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [showAdd, setShowAdd] = useState(false)

  const grade = (id, score) => {
    update((prev) => ({
      ...prev,
      gradingQueue: prev.gradingQueue.map((r) =>
        r.id === id ? { ...r, status: 'graded', score: Number(score) } : r,
      ),
    }))
  }

  const remove = (id) => {
    if (!confirm('Xóa dòng này khỏi hàng đợi?')) return
    update((prev) => ({
      ...prev,
      gradingQueue: prev.gradingQueue.filter((r) => r.id !== id),
    }))
  }

  const reopen = (id) => {
    update((prev) => ({
      ...prev,
      gradingQueue: prev.gradingQueue.map((r) =>
        r.id === id ? { ...r, status: 'pending', score: undefined } : r,
      ),
    }))
  }

  const addRow = (e) => {
    e.preventDefault()
    if (!form.studentName.trim()) return
    const id = `G${Date.now().toString(36).toUpperCase().slice(-6)}`
    update((prev) => ({
      ...prev,
      gradingQueue: [
        {
          id,
          studentName: form.studentName.trim(),
          assignment: form.assignment.trim() || 'Bài tập',
          submittedAt: form.submittedAt.trim() || new Date().toLocaleString('vi-VN'),
          status: 'pending',
        },
        ...prev.gradingQueue,
      ],
    }))
    setForm(empty)
    setShowAdd(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Chấm điểm</h2>
          <p className="text-sm text-slate-400">Thêm bài nộp, chấm điểm, xóa hoặc mở lại chấm — lưu cục bộ.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Thêm bài nộp
        </button>
      </div>

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
                        onClick={() => {
                          const el = document.getElementById(`score-${r.id}`)
                          const v = el?.value
                          if (v === '' || Number.isNaN(Number(v))) return
                          grade(r.id, v)
                        }}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Lưu điểm
                      </button>
                      <button type="button" onClick={() => remove(r.id)} className="text-xs text-red-400 hover:text-red-300">
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-slate-500">Đã chấm</span>
                      <button type="button" onClick={() => reopen(r.id)} className="text-xs text-amber-400 hover:text-amber-300">
                        Sửa điểm
                      </button>
                      <button type="button" onClick={() => remove(r.id)} className="text-xs text-red-400 hover:text-red-300">
                        Xóa
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={addRow} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Thêm bài vào hàng đợi chấm</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Học sinh
              <input
                value={form.studentName}
                onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Tên bài
              <input
                value={form.assignment}
                onChange={(e) => setForm((f) => ({ ...f, assignment: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Nộp lúc
              <input
                value={form.submittedAt}
                onChange={(e) => setForm((f) => ({ ...f, submittedAt: e.target.value }))}
                placeholder="20/03 21:10"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Hủy
              </button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Thêm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
