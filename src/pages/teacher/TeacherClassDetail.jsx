import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTeacherState } from '../../hooks/useTeacherState'

const emptyRoster = { name: '', email: '', avgScore: 8, attendance: '90%' }

export default function TeacherClassDetail() {
  const { classId } = useParams()
  const { state, update } = useTeacherState()
  const cls = state.classes.find((c) => c.id === classId)
  const roster = (classId && state.rosters[classId]) || []
  const [form, setForm] = useState(emptyRoster)
  const [editing, setEditing] = useState(null)

  const saveRoster = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !classId) return
    const id =
      editing === 'new'
        ? `HV${Date.now().toString(36).toUpperCase().slice(-6)}`
        : editing
    update((prev) => {
      const list = [...(prev.rosters[classId] || [])]
      if (editing === 'new') {
        list.push({
          id,
          name: form.name.trim(),
          email: form.email.trim() || '—',
          avgScore: Number(form.avgScore) || 0,
          attendance: form.attendance.trim() || '—',
        })
      } else {
        const idx = list.findIndex((x) => x.id === id)
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            name: form.name.trim(),
            email: form.email.trim() || '—',
            avgScore: Number(form.avgScore) || 0,
            attendance: form.attendance.trim() || '—',
          }
        }
      }
      const newCount = list.length
      return {
        ...prev,
        rosters: { ...prev.rosters, [classId]: list },
        classes: prev.classes.map((c) => (c.id === classId ? { ...c, students: newCount } : c)),
      }
    })
    setEditing(null)
    setForm(emptyRoster)
  }

  const removeStudent = (sid) => {
    if (!confirm('Xóa học sinh khỏi lớp?')) return
    if (!classId) return
    update((prev) => {
      const list = (prev.rosters[classId] || []).filter((x) => x.id !== sid)
      return {
        ...prev,
        rosters: { ...prev.rosters, [classId]: list },
        classes: prev.classes.map((c) => (c.id === classId ? { ...c, students: list.length } : c)),
      }
    })
  }

  const openEdit = (s) => {
    setEditing(s.id)
    setForm({
      name: s.name,
      email: s.email,
      avgScore: s.avgScore,
      attendance: s.attendance,
    })
  }

  if (!cls) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Không tìm thấy lớp.</p>
        <Link to="/giao-vien/lop-hoc" className="text-emerald-400 hover:text-emerald-300">
          ← Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/giao-vien/lop-hoc" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Danh sách lớp
        </Link>
        <h2 className="mt-2 text-xl font-bold text-white">{cls.name}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {cls.subject} · Khối {cls.grade} · {cls.schedule}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-white">Học sinh trong lớp ({roster.length})</h3>
            <p className="mt-1 text-xs text-slate-500">Thêm / sửa / xóa — đồng bộ sĩ số lớp — lưu cục bộ.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing('new')
              setForm(emptyRoster)
            }}
            className="rounded-lg border border-dashed border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10"
          >
            + Thêm học sinh
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 pr-4">Mã</th>
                <th className="py-2 pr-4">Họ tên</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Điểm TB</th>
                <th className="py-2 pr-4">Có mặt</th>
                <th className="py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {roster.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 font-mono text-xs text-emerald-300">{s.id}</td>
                  <td className="py-3">{s.name}</td>
                  <td className="py-3 text-slate-400">{s.email}</td>
                  <td className="py-3">{s.avgScore}</td>
                  <td className="py-3 text-slate-400">{s.attendance}</td>
                  <td className="py-3 space-x-2">
                    <button type="button" onClick={() => openEdit(s)} className="text-xs text-emerald-400 hover:text-emerald-300">
                      Sửa
                    </button>
                    <button type="button" onClick={() => removeStudent(s.id)} className="text-xs text-red-400 hover:text-red-300">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/giao-vien/bai-tap"
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          Giao bài cho lớp
        </Link>
        <Link
          to="/giao-vien/cham-diem"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20"
        >
          Chấm điểm
        </Link>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={saveRoster} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">{editing === 'new' ? 'Thêm học sinh' : 'Sửa học sinh'}</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Họ tên
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-400">
                Điểm TB
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={form.avgScore}
                  onChange={(e) => setForm((f) => ({ ...f, avgScore: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Có mặt
                <input
                  value={form.attendance}
                  onChange={(e) => setForm((f) => ({ ...f, attendance: e.target.value }))}
                  placeholder="90%"
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
