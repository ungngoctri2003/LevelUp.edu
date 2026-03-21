import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

export default function AdminCourses() {
  const { state, update } = useAdminState()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '' })

  const openEdit = (c) => {
    setEditing(c)
    setForm({ title: c.title, description: c.description })
  }

  const saveEdit = (e) => {
    e.preventDefault()
    if (!editing) return
    update((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === editing.id ? { ...c, title: form.title.trim(), description: form.description.trim() } : c,
      ),
    }))
    appendAdminActivity(`Cập nhật khóa học: ${form.title.trim()}`)
    setEditing(null)
  }

  const toggleVisible = (id) => {
    const c = state.courses.find((x) => x.id === id)
    update((prev) => ({
      ...prev,
      courses: prev.courses.map((x) => (x.id === id ? { ...x, visible: x.visible === false } : x)),
    }))
    if (c) {
      const nextVis = c.visible === false
      appendAdminActivity(`${nextVis ? 'Hiện' : 'Ẩn'} khóa: ${c.title}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Khóa học</h2>
        <p className="text-sm text-slate-400">
          Chỉnh nội dung hiển thị trên trang chủ (mục Khóa học). Ẩn khóa sẽ gỡ khỏi website công khai.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">
            Xem trang chủ →
          </Link>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {state.courses.map((c) => (
          <div
            key={c.id}
            className={`rounded-2xl border bg-white/5 p-5 backdrop-blur-sm ${
              c.visible === false ? 'border-amber-500/30 opacity-80' : 'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{c.title}</h3>
              {c.visible === false && (
                <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">Đang ẩn</span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/10"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => toggleVisible(c.id)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                {c.visible === false ? 'Hiện trên web' : 'Ẩn khóa'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white">Chỉnh khóa học</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Tiêu đề
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Mô tả
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={5}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
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
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
