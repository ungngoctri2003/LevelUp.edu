import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { id: '', name: '', subject: '', grade: '12', students: 0, schedule: '' }

export default function TeacherClasses() {
  const { state, update } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const openCreate = () => {
    setEditing('new')
    setForm({ ...empty, id: '' })
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      id: c.id,
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      students: c.students,
      schedule: c.schedule,
    })
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editing === 'new') {
      const id =
        form.id.trim().replace(/\s+/g, '') ||
        `LH${Date.now().toString(36).toUpperCase().slice(-4)}`
      if (state.classes.some((c) => c.id === id)) {
        alert('Mã lớp đã tồn tại.')
        return
      }
      update((prev) => ({
        ...prev,
        classes: [
          ...prev.classes,
          {
            id,
            name: form.name.trim(),
            subject: form.subject.trim() || '—',
            grade: form.grade.trim() || '—',
            students: Math.max(0, Number(form.students) || 0),
            schedule: form.schedule.trim() || '—',
          },
        ],
        rosters: { ...prev.rosters, [id]: prev.rosters[id] || [] },
      }))
    } else if (editing) {
      update((prev) => ({
        ...prev,
        classes: prev.classes.map((c) =>
          c.id === editing
            ? {
                ...c,
                name: form.name.trim(),
                subject: form.subject.trim() || '—',
                grade: form.grade.trim() || '—',
                students: Math.max(0, Number(form.students) || 0),
                schedule: form.schedule.trim() || '—',
              }
            : c,
        ),
      }))
    }
    setEditing(null)
  }

  const remove = (c) => {
    if (!confirm(`Xóa lớp "${c.name}"? Danh sách học sinh trong lớp cũng sẽ bị xóa.`)) return
    update((prev) => {
      const { [c.id]: _, ...restRosters } = prev.rosters
      return {
        ...prev,
        classes: prev.classes.filter((x) => x.id !== c.id),
        rosters: restRosters,
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lớp học của tôi</h2>
          <p className="text-sm text-slate-400">Thêm, sửa, xóa lớp — lưu cục bộ.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Thêm lớp
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {state.classes.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{c.name}</h3>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">{c.id}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {c.subject} · Khối {c.grade}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              <span className="text-slate-500">Học sinh:</span> {c.students}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              <span className="text-slate-500">Lịch:</span> {c.schedule}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/giao-vien/lop-hoc/${c.id}`}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                Chi tiết lớp →
              </Link>
              <button type="button" onClick={() => openEdit(c)} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10">
                Sửa
              </button>
              <button type="button" onClick={() => remove(c)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">{editing === 'new' ? 'Thêm lớp' : 'Sửa lớp'}</h3>
            {editing === 'new' && (
              <label className="mt-4 block text-sm text-slate-400">
                Mã lớp (VD: LH04)
                <input
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Để trống sẽ tự sinh"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
            )}
            <label className="mt-3 block text-sm text-slate-400">
              Tên lớp
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-400">
                Môn
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Khối
                <input
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm text-slate-400">
              Sĩ số
              <input
                type="number"
                min={0}
                value={form.students}
                onChange={(e) => setForm((f) => ({ ...f, students: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Lịch học
              <input
                value={form.schedule}
                onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
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
