import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { Link } from 'react-router-dom'
import { useTeacherState } from '../../hooks/useTeacherState'
import {
  inputTeacher,
  modalBackdrop,
  modalPanelTeacher,
  labelAdmin,
  btnPrimaryTeacher,
} from '../../components/dashboard/dashboardStyles'

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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lớp học của tôi</h2>
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
          <div key={c.id} className="rounded-2xl border border-gray-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
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
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
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
        <div className={modalBackdrop}>
          <form onSubmit={save} className={`${modalPanelTeacher} max-h-[90vh] max-w-md overflow-y-auto`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing === 'new' ? 'Thêm lớp' : 'Sửa lớp'}</h3>
            {editing === 'new' && (
              <label className={`mt-4 ${labelAdmin}`}>
                Mã lớp (tùy chọn, unique)
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className={`${inputTeacher} mt-1 w-full`}
                />
              </label>
            )}
            <label className={`mt-3 ${labelAdmin}`}>
              Tên lớp
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={`${inputTeacher} mt-1 w-full`}
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={labelAdmin}>
                Môn
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className={`${inputTeacher} mt-1 w-full`}
                />
              </label>
              <label className={labelAdmin}>
                Khối
                <input
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                  className={`${inputTeacher} mt-1 w-full`}
                />
              </label>
            </div>
            <label className={`mt-3 ${labelAdmin}`}>
              Tóm tắt lịch (text)
              <input
                value={form.schedule}
                onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                className={`${inputTeacher} mt-1 w-full`}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Hủy
              </button>
              <button type="submit" className={btnPrimaryTeacher}>
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
