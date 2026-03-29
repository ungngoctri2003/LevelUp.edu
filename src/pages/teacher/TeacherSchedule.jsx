import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { classId: '', day: 'Thứ 2', time: '', room: 'Online - Zoom' }

export default function TeacherSchedule() {
  const { state, loading, error, addScheduleSlot, deleteScheduleSlot } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!form.classId || !form.time.trim()) return
    try {
      await addScheduleSlot(form.classId, form.day, form.time.trim(), form.room.trim())
      setForm(empty)
      setShowForm(false)
    } catch (err) {
      toastActionError(err, 'Không thêm được buổi học.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lịch dạy</h2>
          <p className="text-sm text-slate-400">Bảng schedule_slots theo từng lớp.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Thêm buổi
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Thứ / giờ</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Phòng</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.schedule.map((s) => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  {s.day} · {s.time}
                </td>
                <td className="px-4 py-3 text-slate-400">{s.className}</td>
                <td className="px-4 py-3">{s.room}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Xóa buổi này?')) return
                      try {
                        await deleteScheduleSlot(s.id)
                      } catch (err) {
                        toastActionError(err, 'Không xóa được buổi học.')
                      }
                    }}
                    className="text-xs text-red-400"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Thêm buổi học</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Lớp
              <select
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              >
                <option value="">— Chọn —</option>
                {state.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Thứ
              <select
                value={form.day}
                onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              >
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Giờ (vd. 18:00–19:30)
              <input
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Phòng / link
              <input
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300">
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
