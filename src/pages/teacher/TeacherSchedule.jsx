import { useState } from 'react'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { day: 'Thứ 2', time: '', className: '', room: 'Online - Zoom' }

export default function TeacherSchedule() {
  const { state, update } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const openCreate = () => {
    setEditing('new')
    setForm(empty)
  }

  const openEdit = (s) => {
    setEditing(s.id)
    setForm({ day: s.day, time: s.time, className: s.className, room: s.room })
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.time.trim() && !form.className.trim()) return
    if (editing === 'new') {
      const id = `S${Date.now().toString(36).toUpperCase().slice(-6)}`
      update((prev) => ({
        ...prev,
        schedule: [
          ...prev.schedule,
          {
            id,
            day: form.day,
            time: form.time.trim(),
            className: form.className.trim() || '—',
            room: form.room.trim() || 'Online',
          },
        ],
      }))
    } else if (editing) {
      update((prev) => ({
        ...prev,
        schedule: prev.schedule.map((s) =>
          s.id === editing
            ? {
                ...s,
                day: form.day,
                time: form.time.trim(),
                className: form.className.trim() || '—',
                room: form.room.trim() || 'Online',
              }
            : s,
        ),
      }))
    }
    setEditing(null)
  }

  const remove = (id) => {
    if (!confirm('Xóa buổi học này khỏi lịch?')) return
    update((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((s) => s.id !== id),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lịch dạy</h2>
          <p className="text-sm text-slate-400">Thêm, sửa, xóa buổi học — lưu cục bộ.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Thêm buổi
        </button>
      </div>

      <div className="space-y-3">
        {state.schedule.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-white">
                {s.day} · <span className="text-emerald-300">{s.time}</span>
              </p>
              <p className="text-sm text-slate-400">{s.className}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-500">{s.room}</p>
              <button type="button" onClick={() => openEdit(s)} className="text-xs text-emerald-400 hover:text-emerald-300">
                Sửa
              </button>
              <button type="button" onClick={() => remove(s.id)} className="text-xs text-red-400 hover:text-red-300">
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">{editing === 'new' ? 'Thêm buổi học' : 'Sửa buổi học'}</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Thứ
              <select
                value={form.day}
                onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              >
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Giờ
              <input
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                placeholder="19:30 - 21:00"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Lớp / tên hiển thị
              <input
                value={form.className}
                onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Phòng / link
              <input
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
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
