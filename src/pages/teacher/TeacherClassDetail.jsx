import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { Link, useParams } from 'react-router-dom'
import { useTeacherState } from '../../hooks/useTeacherState'

const emptyRoster = { studentId: '', avgScore: 8, attendance: '90' }

export default function TeacherClassDetail() {
  const { classId } = useParams()
  const {
    state,
    loading,
    error,
    addEnrollment,
    removeEnrollment,
    updateEnrollmentMetrics,
  } = useTeacherState()
  const cls = state.classes.find((c) => c.id === classId)
  const roster = (classId && state.rosters[classId]) || []
  const [form, setForm] = useState(emptyRoster)
  const [editing, setEditing] = useState(null)

  const saveRoster = async (e) => {
    e.preventDefault()
    if (!classId) return
    if (editing === 'new') {
      if (!form.studentId.trim()) return
      try {
        await addEnrollment(classId, form.studentId.trim())
        setEditing(null)
        setForm(emptyRoster)
      } catch (err) {
        toastActionError(err, 'Không thêm được học viên vào lớp.')
      }
      return
    }
    if (editing && editing !== 'new') {
      try {
        const pct = form.attendance.replace(/%/g, '').trim()
        await updateEnrollmentMetrics(classId, editing, form.avgScore, pct ? Number(pct) : null)
        setEditing(null)
        setForm(emptyRoster)
      } catch (err) {
        toastActionError(err, 'Không lưu được điểm / chuyên cần.')
      }
    }
  }

  const removeStudent = async (sid) => {
    if (!confirm('Xóa học sinh khỏi lớp?')) return
    if (!classId) return
    try {
      await removeEnrollment(classId, sid)
    } catch (err) {
      toastActionError(err, 'Không gỡ được học viên khỏi lớp.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const openEdit = (s) => {
    setEditing(s.id)
    setForm({
      studentId: s.id,
      avgScore: s.avgScore,
      attendance: String(s.attendance || '').replace('%', ''),
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

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <p className="text-xs text-slate-500">
        Thêm học viên bằng mã tài khoản nội bộ (do quản trị hoặc danh sách học viên cung cấp).
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing('new')
            setForm(emptyRoster)
          }}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Thêm học viên
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Học viên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">ĐTB</th>
              <th className="px-4 py-3">Chuyên cần</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {roster.map((s) => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-slate-400">{s.email}</td>
                <td className="px-4 py-3">{s.avgScore}</td>
                <td className="px-4 py-3">{s.attendance}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => openEdit(s)} className="mr-2 text-xs text-emerald-400">
                    Sửa
                  </button>
                  <button type="button" onClick={() => removeStudent(s.id)} className="text-xs text-red-400">
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
          <form onSubmit={saveRoster} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">
              {editing === 'new' ? 'Thêm học viên' : 'Cập nhật điểm / chuyên cần'}
            </h3>
            {editing === 'new' ? (
              <label className="mt-4 block text-sm text-slate-400">
                Mã tài khoản học viên
                <input
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-white"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </label>
            ) : (
              <>
                <label className="mt-4 block text-sm text-slate-400">
                  Điểm TB
                  <input
                    type="number"
                    step="0.1"
                    value={form.avgScore}
                    onChange={(e) => setForm((f) => ({ ...f, avgScore: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                  />
                </label>
                <label className="mt-3 block text-sm text-slate-400">
                  Chuyên cần (%)
                  <input
                    value={form.attendance}
                    onChange={(e) => setForm((f) => ({ ...f, attendance: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                  />
                </label>
              </>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setForm(emptyRoster)
                }}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300"
              >
                Hủy
              </button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
