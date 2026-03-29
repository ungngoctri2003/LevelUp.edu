import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import { useTeacherState } from '../../hooks/useTeacherState'

const empty = { classId: '', title: '', duration: '45 phút' }

export default function TeacherLessons() {
  const { state, loading, error, addLessonPost, deleteLessonPost } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.classId) return
    try {
      await addLessonPost(form.classId, form.title.trim(), form.duration.trim())
      setForm(empty)
      setShowForm(false)
    } catch (err) {
      toastActionError(err, 'Không thêm được bài giảng.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const field =
    'mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/15'

  return (
    <div className="space-y-8">
      <PageHeader title="Bài giảng đã đăng" description="Bảng teacher_lesson_posts.">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl border border-dashed border-emerald-400/45 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          + Thêm bài giảng
        </button>
      </PageHeader>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-white/10 bg-black/20 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Thời lượng</th>
                <th className="px-4 py-3">Lượt xem</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {state.lessons.map((l) => (
                <tr key={l.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{l.title}</td>
                  <td className="px-4 py-3 text-slate-400">{l.className}</td>
                  <td className="px-4 py-3">{l.duration}</td>
                  <td className="px-4 py-3">{l.views}</td>
                  <td className="px-4 py-3 text-slate-500">{l.updated}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Xóa bài giảng?')) return
                        try {
                          await deleteLessonPost(l.id)
                        } catch (err) {
                          toastActionError(err, 'Không xóa được bài giảng.')
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
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Thêm bài giảng</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Lớp
              <select
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                className={field}
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
              Tiêu đề
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={field} />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Thời lượng hiển thị
              <input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className={field} />
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
