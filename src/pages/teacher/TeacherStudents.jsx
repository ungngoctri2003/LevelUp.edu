import { useState } from 'react'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { name: '', className: '', progress: 50, lastActive: 'Hôm nay' }

export default function TeacherStudents() {
  const { state, update } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const openCreate = () => {
    setEditing('new')
    setForm(empty)
  }

  const openEdit = (s) => {
    setEditing(s.id)
    setForm({
      name: s.name,
      className: s.className,
      progress: s.progress,
      lastActive: s.lastActive,
    })
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const progress = Math.min(100, Math.max(0, Number(form.progress) || 0))
    if (editing === 'new') {
      const id = `HV${Date.now().toString(36).toUpperCase().slice(-6)}`
      update((prev) => ({
        ...prev,
        teacherStudents: [
          {
            id,
            name: form.name.trim(),
            className: form.className.trim() || '—',
            progress,
            lastActive: form.lastActive.trim() || '—',
          },
          ...prev.teacherStudents,
        ],
      }))
    } else if (editing) {
      update((prev) => ({
        ...prev,
        teacherStudents: prev.teacherStudents.map((s) =>
          s.id === editing
            ? {
                ...s,
                name: form.name.trim(),
                className: form.className.trim() || '—',
                progress,
                lastActive: form.lastActive.trim() || '—',
              }
            : s,
        ),
      }))
    }
    setEditing(null)
  }

  const remove = (id) => {
    if (!confirm('Xóa học sinh khỏi danh sách theo dõi?')) return
    update((prev) => ({
      ...prev,
      teacherStudents: prev.teacherStudents.filter((s) => s.id !== id),
    }))
  }

  const setProgress = (id, value) => {
    const v = Math.min(100, Math.max(0, Number(value) || 0))
    update((prev) => ({
      ...prev,
      teacherStudents: prev.teacherStudents.map((s) => (s.id === id ? { ...s, progress: v } : s)),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Học sinh</h2>
          <p className="text-sm text-slate-400">Theo dõi tiến độ — thêm / sửa / xóa — lưu cục bộ.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Thêm học sinh
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Tiến độ</th>
              <th className="px-4 py-3">Hoạt động</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.teacherStudents.map((s) => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-emerald-300">{s.id}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-slate-400">{s.className}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={s.progress}
                      onChange={(e) => setProgress(s.id, e.target.value)}
                      className="h-2 w-28 accent-emerald-500"
                    />
                    <span className="text-xs text-slate-400">{s.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">{s.lastActive}</td>
                <td className="px-4 py-3 space-x-2">
                  <button type="button" onClick={() => openEdit(s)} className="text-xs text-emerald-400 hover:text-emerald-300">
                    Sửa
                  </button>
                  <button type="button" onClick={() => remove(s.id)} className="text-xs text-red-400 hover:text-red-300">
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
            <h3 className="text-lg font-semibold text-white">{editing === 'new' ? 'Thêm học sinh' : 'Sửa thông tin'}</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Họ tên
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
              Tiến độ (%)
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Hoạt động gần nhất
              <input
                value={form.lastActive}
                onChange={(e) => setForm((f) => ({ ...f, lastActive: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
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
