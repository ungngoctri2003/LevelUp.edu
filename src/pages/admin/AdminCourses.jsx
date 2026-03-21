import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminState } from '../../hooks/useAdminState'
import { appendAdminActivity } from '../../utils/adminStorage'

export default function AdminCourses() {
  const { state, update } = useAdminState()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', subject: '' })
  const [createDraft, setCreateDraft] = useState({ title: '', description: '', subject: '' })

  const openEdit = (c) => {
    setEditing(c)
    setForm({ title: c.title, description: c.description, subject: c.subject || '' })
  }

  const saveEdit = (e) => {
    e.preventDefault()
    if (!editing) return
    update((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === editing.id
          ? {
              ...c,
              title: form.title.trim(),
              description: form.description.trim(),
              subject: form.subject.trim() || undefined,
            }
          : c,
      ),
    }))
    appendAdminActivity(`Cập nhật khóa học: ${form.title.trim()}`)
    setEditing(null)
  }

  const addCourse = (e) => {
    e.preventDefault()
    if (!createDraft.title.trim()) return
    const nextId = Math.max(0, ...state.courses.map((c) => Number(c.id) || 0)) + 1
    update((prev) => ({
      ...prev,
      courses: [
        ...prev.courses,
        {
          id: nextId,
          title: createDraft.title.trim(),
          description: createDraft.description.trim() || 'Mô tả đang cập nhật.',
          subject: createDraft.subject.trim() || undefined,
          visible: true,
        },
      ],
    }))
    appendAdminActivity(`Thêm khóa học: ${createDraft.title.trim()}`)
    setCreateDraft({ title: '', description: '', subject: '' })
  }

  const deleteCourse = (c) => {
    if (!confirm(`Xóa khóa "${c.title}"?`)) return
    update((prev) => ({
      ...prev,
      courses: prev.courses.filter((x) => x.id !== c.id),
    }))
    appendAdminActivity(`Xóa khóa: ${c.title}`)
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

      <form onSubmit={addCourse} className="rounded-2xl border border-dashed border-cyan-500/30 bg-white/5 p-5 backdrop-blur-sm">
        <h3 className="font-semibold text-white">Thêm khóa học mới</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={createDraft.title}
            onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Tiêu đề khóa"
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <input
            value={createDraft.subject}
            onChange={(e) => setCreateDraft((d) => ({ ...d, subject: e.target.value }))}
            placeholder="Môn (VD: Vật lý)"
            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-cyan-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 sm:col-span-2 sm:max-w-xs"
          >
            Tạo khóa
          </button>
        </div>
        <textarea
          value={createDraft.description}
          onChange={(e) => setCreateDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Mô tả ngắn"
          rows={2}
          className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
        />
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {state.courses.map((c) => (
          <div
            key={c.id}
            className={`rounded-2xl border bg-white/5 p-5 backdrop-blur-sm ${
              c.visible === false ? 'border-amber-500/30 opacity-80' : 'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                {c.subject && (
                  <span className="mb-1.5 inline-block rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-200">
                    {c.subject}
                  </span>
                )}
                <h3 className="font-semibold text-white">{c.title}</h3>
              </div>
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
              <button
                type="button"
                onClick={() => deleteCourse(c)}
                className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
              >
                Xóa
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
              Môn (nhãn hiển thị)
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="VD: Văn, Sinh..."
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
