import { useState } from 'react'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { classId: '', title: '', due: '' }

export default function TeacherAssignments() {
  const { state, loading, error, addAssignment, deleteAssignment } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.classId) return
    try {
      const dueAt = form.due.trim() ? new Date(form.due).toISOString() : null
      await addAssignment(form.classId, form.title.trim(), dueAt)
      setForm(empty)
      setShowForm(false)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bài tập & kiểm tra</h2>
          <p className="text-sm text-slate-400">Bảng assignments.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Giao bài
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Bài</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Hạn</th>
              <th className="px-4 py-3">Nộp</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.assignments.map((a) => (
              <tr key={a.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 text-slate-400">{a.className}</td>
                <td className="px-4 py-3 text-slate-400">{a.due}</td>
                <td className="px-4 py-3">
                  {a.submitted}/{a.total}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Xóa bài tập?')) return
                      try {
                        await deleteAssignment(a.id)
                      } catch (err) {
                        alert(err.message)
                      }
                    }}
                    className="text-xs text-red-400"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Giao bài mới</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Lớp
              <select
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              >
                <option value="">— Chọn —</option>
                {state.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Tiêu đề
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Hạn nộp (datetime-local, tùy chọn)
              <input
                type="datetime-local"
                value={form.due}
                onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300">
                Hủy
              </button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
