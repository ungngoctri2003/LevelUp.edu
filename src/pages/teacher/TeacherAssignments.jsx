import { useState } from 'react'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { title: '', className: '', due: '', submitted: 0, total: 30 }

export default function TeacherAssignments() {
  const { state, update } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const openCreate = () => {
    setEditing('new')
    setForm(empty)
  }

  const openEdit = (a) => {
    setEditing(a.id)
    setForm({
      title: a.title,
      className: a.className,
      due: a.due,
      submitted: a.submitted,
      total: a.total,
    })
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editing === 'new') {
      const id = `BT${Date.now().toString(36).toUpperCase().slice(-6)}`
      update((prev) => ({
        ...prev,
        assignments: [
          ...prev.assignments,
          {
            id,
            title: form.title.trim(),
            className: form.className.trim() || '—',
            due: form.due.trim() || new Date().toLocaleDateString('vi-VN'),
            submitted: Math.max(0, Number(form.submitted) || 0),
            total: Math.max(1, Number(form.total) || 1),
          },
        ],
      }))
    } else if (editing) {
      update((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.id === editing
            ? {
                ...a,
                title: form.title.trim(),
                className: form.className.trim() || '—',
                due: form.due.trim() || a.due,
                submitted: Math.max(0, Number(form.submitted) || 0),
                total: Math.max(1, Number(form.total) || 1),
              }
            : a,
        ),
      }))
    }
    setEditing(null)
  }

  const remove = (id) => {
    if (!confirm('Xóa bài tập này?')) return
    update((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== id),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bài tập & kiểm tra</h2>
          <p className="text-sm text-slate-400">CRUD bài giao — lưu cục bộ.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Giao bài mới
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Tên bài</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Hạn nộp</th>
              <th className="px-4 py-3">Đã nộp</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.assignments.map((a) => (
              <tr key={a.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 text-slate-400">{a.className}</td>
                <td className="px-4 py-3">{a.due}</td>
                <td className="px-4 py-3">
                  {a.submitted}/{a.total}{' '}
                  <span className="text-slate-500">({Math.round((a.submitted / a.total) * 100)}%)</span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button type="button" onClick={() => openEdit(a)} className="text-xs text-emerald-400 hover:text-emerald-300">
                    Sửa
                  </button>
                  <button type="button" onClick={() => remove(a.id)} className="text-xs text-red-400 hover:text-red-300">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">{editing === 'new' ? 'Giao bài mới' : 'Sửa bài giao'}</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Tên bài
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Lớp
              <input
                value={form.className}
                onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Hạn nộp
              <input
                value={form.due}
                onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-400">
                Đã nộp
                <input
                  type="number"
                  min={0}
                  value={form.submitted}
                  onChange={(e) => setForm((f) => ({ ...f, submitted: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Tổng HS
                <input
                  type="number"
                  min={1}
                  value={form.total}
                  onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Hủy
              </button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
