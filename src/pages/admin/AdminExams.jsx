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
import { useAdminState } from '../../hooks/useAdminState'
import QuestionBankEditor from '../../components/dashboard/QuestionBankEditor.jsx'
import { questionBankDraftsFromStored, sanitizeMcqBankForDatabase } from '../../lib/mcqQuestions.js'

const emptyForm = {
  title: '',
  subject: '',
  duration: 45,
  questionItems: [],
  level: 'Lớp 10',
  assigned: false,
  published: true,
}

export default function AdminExams() {
  const { state, loading, error, addExam, updateExam, deleteExam } = useAdminState()
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const rowToForm = (ex) => ({
    title: ex.title,
    subject: ex.subject,
    duration: ex.duration,
    questions: ex.questions,
    questionItems: questionBankDraftsFromStored(ex.questionItems),
    level: ex.level,
    assigned: !!ex.assigned,
    published: ex.published !== false,
  })

  const addExamSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      const sanitized = sanitizeMcqBankForDatabase(form.questionItems)
      await addExam({
        ...form,
        questionItems: form.questionItems,
        questions: sanitized.length,
      })
      setForm(emptyForm)
    } catch (err) {
      toastActionError(err, 'Không tạo được đề.')
    }
  }

  const toggle = async (id, field) => {
    const ex = state.exams.find((x) => x.id === id)
    if (!ex) return
    const next = rowToForm(ex)
    if (field === 'assigned') next.assigned = !ex.assigned
    if (field === 'published') next.published = !(ex.published !== false)
    try {
      await updateExam(id, next)
    } catch (err) {
      toastActionError(err, 'Không cập nhật được đề.')
    }
  }

  const openEdit = (ex) => {
    setEditId(ex.id)
    setEditForm(rowToForm(ex))
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.title.trim() || editId == null) return
    try {
      const sanitized = sanitizeMcqBankForDatabase(editForm.questionItems)
      await updateExam(editId, {
        ...editForm,
        questionItems: editForm.questionItems,
        questions: sanitized.length,
      })
      setEditId(null)
    } catch (err) {
      toastActionError(err, 'Không lưu được đề.')
    }
  }

  const del = async (ex) => {
    if (!confirm(`Xóa đề "${ex.title}"?`)) return
    try {
      await deleteExam(ex.id, ex.title)
    } catch (err) {
      toastActionError(err, 'Không xóa được đề.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const field = `${inputAdmin} mt-1 w-full`

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bài kiểm tra & đề"
        description={
          <>
            Đề thi tạo tại đây sẽ hiển thị cho học viên trên{' '}
            <Link className="font-medium text-cyan-400 hover:text-cyan-300" to="/bai-kiem-tra">
              trang Bài kiểm tra
            </Link>
            . Dùng nút <span className="text-slate-200">Sửa đề</span> trong bảng để chỉnh tiêu đề, thời gian và
            bộ câu hỏi trắc nghiệm.
          </>
        }
        badge="Đề thi"
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <Panel title="Tạo đề mới" subtitle="Thêm đề vào kho đề dùng chung cho website.">
        <form onSubmit={addExamSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm text-slate-400">
              Tên đề
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={field}
                placeholder="VD: Kiểm tra 15 phút — Đạo hàm"
              />
            </label>
            <label className="text-sm text-slate-400">
              Môn
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="VD: Toán học, Vật lý..."
                className={field}
              />
            </label>
            <label className="text-sm text-slate-400">
              Cấp
              <input
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                className={field}
              />
            </label>
            <label className="text-sm text-slate-400">
              Thời gian (phút)
              <input
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className={field}
              />
            </label>
            <p className="flex items-end text-sm text-slate-500 sm:col-span-1">
              Số câu hợp lệ sẽ lưu:{' '}
              <span className="ml-1 font-medium text-slate-300">
                {sanitizeMcqBankForDatabase(form.questionItems).length}
              </span>
            </p>
          </div>
          <QuestionBankEditor
            value={form.questionItems}
            onChange={(questionItems) => setForm((f) => ({ ...f, questionItems }))}
            disabled={loading}
          />
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-300">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.assigned}
                onChange={(e) => setForm((f) => ({ ...f, assigned: e.target.checked }))}
                className="rounded border-white/30 bg-black/40 text-cyan-500"
              />
              Đã giao cho lớp
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.published !== false}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="rounded border-white/30 bg-black/40 text-cyan-500"
              />
              Hiển thị công khai
            </label>
          </div>
          <button type="submit" className={btnPrimaryAdmin} disabled={loading}>
            Thêm đề
          </button>
        </form>
      </Panel>

      <Panel noDivider padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className={tableHeadAdmin}>
              <tr>
                <th className="px-4 py-3">Tên đề</th>
                <th className="px-4 py-3">Môn</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Số câu</th>
                <th className="px-4 py-3">Cấp</th>
                <th className="px-4 py-3">Đã giao</th>
                <th className="px-4 py-3">Công khai</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {state.exams.map((e) => (
                <tr key={e.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{e.title}</td>
                  <td className="px-4 py-3 text-slate-400">{e.subject}</td>
                  <td className="px-4 py-3">{e.duration} phút</td>
                  <td className="px-4 py-3">{e.questions}</td>
                  <td className="px-4 py-3">{e.level}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(e.id, 'assigned')}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        e.assigned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {e.assigned ? 'Có' : 'Chưa'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(e.id, 'published')}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        e.published !== false ? 'bg-cyan-500/20 text-cyan-200' : 'bg-red-500/15 text-red-300'
                      }`}
                    >
                      {e.published !== false ? 'Hiện' : 'Ẩn'}
                    </button>
                  </td>
                  <td className="space-x-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20"
                    >
                      Sửa đề
                    </button>
                    <button type="button" onClick={() => del(e)} className="text-xs text-red-400 hover:text-red-300">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {editId != null && (
        <div className={modalBackdrop}>
          <form
          onSubmit={saveEdit}
          className={`${modalPanelAdmin} max-h-[90vh] max-w-3xl overflow-y-auto`}
        >
            <h3 className="text-lg font-semibold text-white">Sửa đề thi &amp; bộ câu hỏi</h3>
            <p className="mt-1 text-sm text-slate-400">Thay đổi nội dung câu hỏi, đáp án hoặc metadata — nhấn Lưu để cập nhật.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-400 sm:col-span-2">
                Tên đề
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className={field}
                />
              </label>
              <label className="text-sm text-slate-400">
                Môn
                <input
                  value={editForm.subject}
                  onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                  className={field}
                />
              </label>
              <label className="text-sm text-slate-400">
                Cấp
                <input
                  value={editForm.level}
                  onChange={(e) => setEditForm((f) => ({ ...f, level: e.target.value }))}
                  className={field}
                />
              </label>
              <label className="text-sm text-slate-400">
                Thời gian (phút)
                <input
                  type="number"
                  min={5}
                  value={editForm.duration}
                  onChange={(e) => setEditForm((f) => ({ ...f, duration: e.target.value }))}
                  className={field}
                />
              </label>
              <p className="flex items-end text-sm text-slate-500 sm:col-span-2">
                Số câu hợp lệ sẽ lưu:{' '}
                <span className="ml-1 font-medium text-slate-300">
                  {sanitizeMcqBankForDatabase(editForm.questionItems).length}
                </span>
              </p>
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <QuestionBankEditor
                value={editForm.questionItems}
                onChange={(questionItems) => setEditForm((f) => ({ ...f, questionItems }))}
                disabled={loading}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-300">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.assigned}
                  onChange={(e) => setEditForm((f) => ({ ...f, assigned: e.target.checked }))}
                  className="rounded border-white/30 bg-black/40 text-cyan-500"
                />
                Đã giao
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.published !== false}
                  onChange={(e) => setEditForm((f) => ({ ...f, published: e.target.checked }))}
                  className="rounded border-white/30 bg-black/40 text-cyan-500"
                />
                Công khai
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditId(null)}
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
