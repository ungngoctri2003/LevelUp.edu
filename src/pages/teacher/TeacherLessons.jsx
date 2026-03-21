import { useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = {
  title: '',
  className: '',
  duration: '45 phút',
  views: 0,
}

export default function TeacherLessons() {
  const { state, update } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const openCreate = () => {
    setEditing('new')
    setForm(empty)
  }

  const openEdit = (l) => {
    setEditing(l.id)
    setForm({
      title: l.title,
      className: l.className,
      duration: l.duration,
      views: l.views,
    })
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const updated = new Date().toLocaleDateString('vi-VN')
    if (editing === 'new') {
      const id = `BG${Date.now().toString(36).toUpperCase().slice(-6)}`
      update((prev) => ({
        ...prev,
        lessons: [
          {
            id,
            title: form.title.trim(),
            className: form.className.trim() || '—',
            duration: form.duration.trim() || '45 phút',
            views: Number(form.views) || 0,
            updated,
          },
          ...prev.lessons,
        ],
      }))
    } else if (editing) {
      update((prev) => ({
        ...prev,
        lessons: prev.lessons.map((l) =>
          l.id === editing
            ? {
                ...l,
                title: form.title.trim(),
                className: form.className.trim() || '—',
                duration: form.duration.trim() || '45 phút',
                views: Number(form.views) || 0,
                updated,
              }
            : l,
        ),
      }))
    }
    setEditing(null)
    setForm(empty)
  }

  const remove = (id) => {
    if (!confirm('Xóa bài giảng này?')) return
    update((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((l) => l.id !== id),
    }))
  }

  const field =
    'mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/15'

  return (
    <div className="space-y-8">
      <PageHeader title="Bài giảng đã đăng" description="Thêm, sửa, xóa — dữ liệu lưu cục bộ trên trình duyệt.">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border border-dashed border-emerald-400/45 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          + Thêm bài giảng
        </button>
      </PageHeader>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 bg-black/20 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Thời lượng</th>
              <th className="px-4 py-3">Lượt xem</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.lessons.map((l) => (
              <tr key={l.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-emerald-300">{l.id}</td>
                <td className="px-4 py-3">{l.title}</td>
                <td className="px-4 py-3 text-slate-400">{l.className}</td>
                <td className="px-4 py-3">{l.duration}</td>
                <td className="px-4 py-3">{l.views}</td>
                <td className="px-4 py-3 text-slate-400">{l.updated}</td>
                <td className="px-4 py-3 space-x-2">
                  <button type="button" onClick={() => openEdit(l)} className="text-xs text-emerald-400 hover:text-emerald-300">
                    Sửa
                  </button>
                  <button type="button" onClick={() => remove(l.id)} className="text-xs text-red-400 hover:text-red-300">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Panel>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <form
            onSubmit={save}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-emerald-500/10 ring-1 ring-white/10"
          >
            <h3 className="text-lg font-semibold text-white">{editing === 'new' ? 'Thêm bài giảng' : 'Sửa bài giảng'}</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Tiêu đề
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Lớp / nhóm
              <input
                value={form.className}
                onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                className={field}
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-400">
                Thời lượng
                <input
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  className={field}
                />
              </label>
              <label className="text-sm text-slate-400">
                Lượt xem
                <input
                  type="number"
                  min={0}
                  value={form.views}
                  onChange={(e) => setForm((f) => ({ ...f, views: e.target.value }))}
                  className={field}
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
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:opacity-95"
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
