import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import {
  inputAdmin,
  modalBackdrop,
  modalPanelAdmin,
  btnPrimaryAdmin,
  tableHeadAdmin,
} from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { useAdminState } from '../../hooks/useAdminState'
import * as srv from '../../services/adminServerApi.js'

export default function AdminCourses() {
  const { session } = useAuthSession()
  const token = session?.access_token
  const { state, loading, error, addCourse, updateCourse, deleteCourse, refresh } = useAdminState()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', list_price: '' })
  const [createDraft, setCreateDraft] = useState({ title: '', description: '', subject_id: '', list_price: '' })

  const [subjectDraft, setSubjectDraft] = useState({ name: '', slug: '', icon_label: '📘', sort_order: 0 })
  const [subjectEditId, setSubjectEditId] = useState(null)
  const [subjectEditForm, setSubjectEditForm] = useState({ name: '', slug: '', icon_label: '', sort_order: 0 })

  const firstSubjectId = state.subjects[0]?.id
  const subjects = state.subjects

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      title: c.title,
      description: c.description,
      subject_id: String(c.subject_id ?? ''),
      list_price: c.list_price != null && c.list_price !== '' ? String(c.list_price) : '',
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
        list_price: form.list_price?.trim() ? form.list_price.trim() : null,
      })
      setEditing(null)
    } catch (err) {
      toastActionError(err, 'Không lưu được khóa học.')
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!createDraft.title.trim()) return
    const sid = Number(createDraft.subject_id) || firstSubjectId
    if (!sid) {
      toast.warning('Chưa có môn học trong danh mục. Hãy thêm môn ở phần trên trước.')
      return
    }
    try {
      await addCourse({
        title: createDraft.title.trim(),
        description: createDraft.description.trim() || 'Mô tả đang cập nhật.',
        subject_id: sid,
        list_price: createDraft.list_price?.trim() ? createDraft.list_price.trim() : null,
      })
      setCreateDraft({ title: '', description: '', subject_id: '', list_price: '' })
    } catch (err) {
      toastActionError(err, 'Không thêm được khóa học.')
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Xóa khóa "${c.title}"?`)) return
    try {
      await deleteCourse(c.id, c.title)
    } catch (err) {
      toastActionError(err, 'Không xóa được khóa học.')
    }
  }

  const toggleVisible = async (c) => {
    try {
      await updateCourse(c.id, {
        visible: c.visible === false,
        title: c.title,
        description: c.description,
        subject_id: c.subject_id,
        list_price: c.list_price,
      })
    } catch (err) {
      toastActionError(err, 'Không cập nhật được trạng thái hiển thị.')
    }
  }

  const addSubject = async (e) => {
    e.preventDefault()
    if (!token || !subjectDraft.name.trim()) return
    try {
      await srv.adminCreateSubject(token, {
        name: subjectDraft.name.trim(),
        slug: subjectDraft.slug.trim() || undefined,
        icon_label: subjectDraft.icon_label.trim() || null,
        sort_order: Number(subjectDraft.sort_order) || 0,
      })
      setSubjectDraft({ name: '', slug: '', icon_label: '📘', sort_order: 0 })
      await refresh()
    } catch (e2) {
      toastActionError(e2, 'Không thêm được môn.')
    }
  }

  const openSubjectEdit = (r) => {
    setSubjectEditId(r.id)
    setSubjectEditForm({
      name: r.name,
      slug: r.slug,
      icon_label: r.icon_label || '',
      sort_order: r.sort_order ?? 0,
    })
  }

  const saveSubjectEdit = async (e) => {
    e.preventDefault()
    if (!token || subjectEditId == null) return
    try {
      await srv.adminPatchSubject(token, subjectEditId, {
        name: subjectEditForm.name.trim(),
        slug: subjectEditForm.slug.trim(),
        icon_label: subjectEditForm.icon_label.trim() || null,
        sort_order: Number(subjectEditForm.sort_order) || 0,
      })
      setSubjectEditId(null)
      await refresh()
    } catch (e2) {
      toastActionError(e2, 'Không lưu được môn.')
    }
  }

  const removeSubject = async (r) => {
    if (!token || !confirm(`Xóa môn "${r.name}"? (Có thể xóa luôn bài giảng liên quan.)`)) return
    try {
      await srv.adminDeleteSubjectApi(token, r.id, r.name)
      await refresh()
    } catch (e2) {
      toastActionError(e2, 'Không xóa được môn.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Khóa học & môn học"
        description="Danh mục môn (slug, icon) dùng cho khóa học và bài giảng; mỗi khóa gắn một môn và hiển thị trên web khi bật."
        badge="Website"
      >
        <Link to="/" className={`${btnPrimaryAdmin} inline-block text-center`}>
          Xem trang chủ →
        </Link>
      </PageHeader>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel
        title="Danh mục môn học"
        subtitle="Bảng public.subjects — thêm môn trước khi tạo khóa hoặc bài giảng."
      >
        <form onSubmit={addSubject} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm text-slate-400">
            Tên môn *
            <input
              value={subjectDraft.name}
              onChange={(e) => setSubjectDraft((d) => ({ ...d, name: e.target.value }))}
              className={field}
              required
            />
          </label>
          <label className="block text-sm text-slate-400">
            Slug (tuỳ chọn)
            <input
              value={subjectDraft.slug}
              onChange={(e) => setSubjectDraft((d) => ({ ...d, slug: e.target.value }))}
              className={field}
              placeholder="toan-thpt"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Icon
            <input
              value={subjectDraft.icon_label}
              onChange={(e) => setSubjectDraft((d) => ({ ...d, icon_label: e.target.value }))}
              className={field}
            />
          </label>
          <label className="block text-sm text-slate-400">
            Thứ tự
            <input
              type="number"
              value={subjectDraft.sort_order}
              onChange={(e) => setSubjectDraft((d) => ({ ...d, sort_order: e.target.value }))}
              className={field}
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button type="submit" className={btnPrimaryAdmin} disabled={!token}>
              Thêm môn
            </button>
          </div>
        </form>

        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={tableHeadAdmin}>
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {subjects.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-slate-500">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-slate-400">{r.slug}</td>
                  <td className="px-4 py-3">{r.icon_label || '—'}</td>
                  <td className="px-4 py-3">{r.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openSubjectEdit(r)}
                      className="mr-2 text-cyan-400 hover:text-cyan-300"
                    >
                      Sửa
                    </button>
                    <button type="button" onClick={() => removeSubject(r)} className="text-red-400 hover:text-red-300">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel variant="highlight" title="Thêm khóa học mới" subtitle="Chọn môn từ danh mục phía trên.">
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
              {subjects.map((s) => (
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
          <label className="block text-sm text-slate-400">
            Giá niêm yết (VNĐ, để trống nếu chưa bán online)
            <input
              type="number"
              min={0}
              step={1000}
              value={createDraft.list_price}
              onChange={(e) => setCreateDraft((d) => ({ ...d, list_price: e.target.value }))}
              placeholder="vd. 500000"
              className={`${inputAdmin} mt-1 w-full max-w-xs`}
            />
          </label>
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
                  {c.list_price != null && Number.isFinite(Number(c.list_price)) ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Giá niêm yết: {Number(c.list_price).toLocaleString('vi-VN')}đ
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-400/90">Chưa có giá niêm yết (không bán online qua form)</p>
                  )}
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
                {subjects.map((s) => (
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
            <label className="mt-3 block text-sm text-slate-400">
              Giá niêm yết (VNĐ, để trống nếu chưa bán online)
              <input
                type="number"
                min={0}
                step={1000}
                value={form.list_price}
                onChange={(e) => setForm((f) => ({ ...f, list_price: e.target.value }))}
                placeholder="vd. 500000"
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

      {subjectEditId != null && (
        <div className={modalBackdrop} role="dialog">
          <form onSubmit={saveSubjectEdit} className={modalPanelAdmin}>
            <h3 className="text-lg font-semibold text-white">Sửa môn #{subjectEditId}</h3>
            <label className="mt-4 block text-sm text-slate-400">
              Tên
              <input
                value={subjectEditForm.name}
                onChange={(e) => setSubjectEditForm((f) => ({ ...f, name: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Slug
              <input
                value={subjectEditForm.slug}
                onChange={(e) => setSubjectEditForm((f) => ({ ...f, slug: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Icon
              <input
                value={subjectEditForm.icon_label}
                onChange={(e) => setSubjectEditForm((f) => ({ ...f, icon_label: e.target.value }))}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm text-slate-400">
              Thứ tự
              <input
                type="number"
                value={subjectEditForm.sort_order}
                onChange={(e) => setSubjectEditForm((f) => ({ ...f, sort_order: e.target.value }))}
                className={field}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubjectEditId(null)}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Huỷ
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
