import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import {
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
  btnPrimaryAdmin,
} from '../../components/dashboard/dashboardStyles'
import { useAdminState } from '../../hooks/useAdminState'

export default function AdminCourses() {
  const { state, loading, error, addCourse, updateCourse, deleteCourse } = useAdminState()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', subject_id: '' })
  const [createDraft, setCreateDraft] = useState({ title: '', description: '', subject_id: '' })

  const firstSubjectId = state.subjects[0]?.id

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      title: c.title,
      description: c.description,
      subject_id: String(c.subject_id ?? ''),
    })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editing) return
    const sid = Number(form.subject_id)
    if (!Number.isFinite(sid)) return
    try {
      await updateCourse(editing.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        subject_id: sid,
      })
      setEditing(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!createDraft.title.trim()) return
    const sid = Number(createDraft.subject_id) || firstSubjectId
    if (!sid) {
      alert('Chưa có môn học trong danh mục. Vui lòng liên hệ quản trị để thiết lập danh mục môn.')
      return
    }
    try {
      await addCourse({
        title: createDraft.title.trim(),
        description: createDraft.description.trim() || 'Mô tả đang cập nhật.',
        subject_id: sid,
      })
      setCreateDraft({ title: '', description: '', subject_id: '' })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Xóa khóa "${c.title}"?`)) return
    try {
      await deleteCourse(c.id, c.title)
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleVisible = async (c) => {
    try {
      await updateCourse(c.id, { visible: c.visible === false, title: c.title, description: c.description, subject_id: c.subject_id })
    } catch (err) {
      alert(err.message)
    }
  }

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Khóa học"
        description="Quản lý khóa học hiển thị trên trang công khai: có thể ẩn hoặc hiện từng khóa."
        badge="Website"
      >
        <Link to="/" className={`${btnPrimaryAdmin} inline-block text-center`}>
          Xem trang chủ →
        </Link>
      </PageHeader>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel variant="highlight" title="Thêm khóa học mới" subtitle="Chọn môn từ danh mục bên dưới.">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={createDraft.title}
              onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Tiêu đề khóa"
              className={inputAdmin}
            />
            <select
              value={createDraft.subject_id || firstSubjectId || ''}
              onChange={(e) => setCreateDraft((d) => ({ ...d, subject_id: e.target.value }))}
              className={inputAdmin}
            >
              {state.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={createDraft.description}
            onChange={(e) => setCreateDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Mô tả ngắn"
            rows={2}
            className={`${inputAdmin} w-full`}
          />
          <button type="submit" className={btnPrimaryAdmin} disabled={loading}>
            Tạo khóa
          </button>
        </form>
      </Panel>

      <Panel title="Danh sách khóa học" subtitle="Khóa đang ẩn sẽ không hiển thị cho khách truy cập trang chủ.">
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
                  <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                    Đang ẩn
                  </span>
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
                  onClick={() => toggleVisible(c)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                >
                  {c.visible === false ? 'Hiện trên web' : 'Ẩn khóa'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {editing && (
        <div className={modalBackdrop}>
          <form onSubmit={saveEdit} className={modalPanelAdmin}>
            <h3 className="text-lg font-semibold text-white">Chỉnh khóa học</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Tiêu đề
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Môn
              <select
                value={form.subject_id}
                onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
                className={field}
              >
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Mô tả
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={5}
                className={field}
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
              <button type="submit" className={btnPrimaryAdmin}>
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
