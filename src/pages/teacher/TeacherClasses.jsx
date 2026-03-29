import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { Link } from 'react-router-dom'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { code: '', name: '', subject: '', grade: '12', schedule: '' }

export default function TeacherClasses() {
  const { state, loading, error, createClass, updateClass, deleteClass } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const openCreate = () => {
    setEditing('new')
    setForm({ ...empty, code: '' })
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      code: c._raw?.code || '',
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      schedule: c.schedule,
    })
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      if (editing === 'new') {
        await createClass({
          code: form.code.trim() || undefined,
          name: form.name.trim(),
          subject: form.subject.trim() || '—',
          grade: form.grade.trim() || '—',
          schedule: form.schedule.trim() || '—',
        })
      } else if (editing) {
        await updateClass(editing, {
          name: form.name.trim(),
          subject: form.subject.trim() || '—',
          grade: form.grade.trim() || '—',
          schedule: form.schedule.trim() || '—',
        })
      }
      setEditing(null)
    } catch (err) {
      toastActionError(err, 'Không lưu được lớp.')
    }
  }

  const remove = async (c) => {
    if (!confirm(`Xóa lớp "${c.name}"?`)) return
    try {
      await deleteClass(c.id)
    } catch (err) {
      toastActionError(err, 'Không xóa được lớp.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lớp học của tôi</h2>
          <p className="text-sm text-slate-400">Danh sách lớp bạn đang phụ trách.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Thêm lớp
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

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
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => remove(c)}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
              >
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
                Mã lớp (tùy chọn, unique)
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
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
              Tóm tắt lịch (text)
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
