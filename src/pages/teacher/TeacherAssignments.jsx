import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toastActionError } from '../../lib/appToast.js'
import { useTeacherState } from '../../hooks/useTeacherState'
import QuestionBankEditor from '../../components/dashboard/QuestionBankEditor.jsx'
import { mergeDateTimeForDeadline, splitDatetimeLocalParts } from '../../lib/datetimeParts.js'

const empty = { classId: '', title: '', dueDate: '', dueTime: '', questionItems: [] }
const emptyExamAssign = { examId: '', classId: '' }

export default function TeacherAssignments() {
  const {
    state,
    loading,
    error,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    assignExamToClass,
    removeExamClassAssignment,
  } = useTeacherState()
  const [form, setForm] = useState(empty)
  const [examAssign, setExamAssign] = useState(emptyExamAssign)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const openCreate = () => {
    setForm(empty)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (a) => {
    const { date, time } = splitDatetimeLocalParts(a.dueInput || '')
    setForm({
      classId: a.classId,
      title: a.title,
      dueDate: date,
      dueTime: time,
      questionItems: JSON.parse(JSON.stringify(a.questionItems?.length ? a.questionItems : [])),
    })
    setEditingId(a.id)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(empty)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (!editingId && !form.classId) return
    try {
      const dueLocal = mergeDateTimeForDeadline(form.dueDate, form.dueTime)
      const dueAt = dueLocal ? new Date(dueLocal).toISOString() : null
      if (editingId) {
        await updateAssignment(editingId, {
          title: form.title.trim(),
          dueAt,
          questionItems: form.questionItems,
        })
      } else {
        await addAssignment(form.classId, form.title.trim(), dueAt, form.questionItems)
      }
      closeModal()
    } catch (err) {
      toastActionError(err, editingId ? 'Không lưu được bài tập.' : 'Không giao được bài tập.')
    }
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bài tập & kiểm tra</h2>
          <p className="text-sm text-slate-400">
            <span className="text-slate-300">Bài tập</span>: giao bài do bạn soạn cho lớp.{' '}
            <span className="text-slate-300">Đề kiểm tra</span>: chọn từ kho đề trung tâm (admin đã đăng) và gán cho lớp của bạn — học viên làm tại trang Bài kiểm tra công khai.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl border border-dashed border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
        >
          + Giao bài
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Bài</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Hạn</th>
              <th className="px-4 py-3">TN</th>
              <th className="px-4 py-3">Nộp</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {state.assignments.map((a) => (
              <tr key={a.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 text-slate-400">{a.className}</td>
                <td className="px-4 py-3 text-slate-400">{a.due}</td>
                <td className="px-4 py-3 text-slate-400">{a.mcqCount > 0 ? `${a.mcqCount} câu` : '—'}</td>
                <td className="px-4 py-3">
                  {a.submitted}/{a.total}
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Xóa bài tập?')) return
                      try {
                        await deleteAssignment(a.id)
                      } catch (err) {
                        toastActionError(err, 'Không xóa được bài tập.')
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Giao đề kiểm tra (kho đề)</h3>
            <p className="text-sm text-slate-500">
              Chỉ các đề <span className="text-slate-400">đã xuất bản</span> trên hệ thống mới hiện trong danh sách. Mỗi cặp đề–lớp chỉ giao một lần.
            </p>
          </div>
        </div>

        <form
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!examAssign.examId || !examAssign.classId) return
            try {
              await assignExamToClass(examAssign.examId, examAssign.classId)
              setExamAssign(emptyExamAssign)
            } catch (err) {
              toastActionError(err, 'Không giao được đề (có thể đã giao trùng lớp).')
            }
          }}
        >
          <label className="min-w-[200px] flex-1 text-sm text-slate-400">
            Đề từ kho
            <select
              value={examAssign.examId}
              onChange={(e) => setExamAssign((f) => ({ ...f, examId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">— Chọn đề —</option>
              {(state.examCatalog || []).map((ex) => (
                <option key={ex.id} value={String(ex.id)}>
                  {ex.title} ({ex.subject_label})
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[180px] flex-1 text-sm text-slate-400">
            Lớp nhận đề
            <select
              value={examAssign.classId}
              onChange={(e) => setExamAssign((f) => ({ ...f, classId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">— Chọn lớp —</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading || !examAssign.examId || !examAssign.classId}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            Giao đề
          </button>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Đề</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {state.examClassLinks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Chưa giao đề nào từ kho. Chọn đề và lớp ở trên.
                  </td>
                </tr>
              )}
              {state.examClassLinks.map((row) => (
                <tr key={`${row.examId}-${row.classId}`} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.examTitle}</div>
                    <div className="text-xs text-slate-500">{row.examSubject}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.className}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {row.contentMode === 'embed' ? 'Nhúng / tương tác' : `${row.questionCount ?? 0} câu TN`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Bỏ giao đề này cho lớp? Học viên sẽ không còn thấy đề qua lớp này.')) return
                        try {
                          await removeExamClassAssignment(row.examId, row.classId)
                        } catch (err) {
                          toastActionError(err, 'Không bỏ giao được.')
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Bỏ giao
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-white">{editingId ? 'Sửa bài tập' : 'Giao bài mới'}</h3>
            {editingId && (
              <p className="mt-1 text-sm text-slate-400">Lớp không đổi khi sửa. Có thể chỉnh tiêu đề, hạn nộp và bộ câu hỏi.</p>
            )}
            <label className="mt-4 block text-sm text-slate-400">
              Lớp
              <select
                value={form.classId}
                disabled={!!editingId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
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
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </label>
            <div className="mt-3">
              <span className="block text-sm text-slate-400">Hạn nộp (tuỳ chọn)</span>
              <p className="mt-0.5 text-xs text-slate-500">Chọn ngày trên lịch; nếu không chọn giờ, hạn được hiểu là cuối ngày đó (23:59).</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-400">
                  Ngày
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white scheme-dark"
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Giờ
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white scheme-dark"
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="mb-3 text-sm text-slate-400">
                Bộ câu hỏi (tùy chọn): nếu có, học viên làm trắc nghiệm và hệ thống chấm tự động (thang 10). Không thêm câu
                thì giữ kiểu xác nhận nộp bài như trước.
              </p>
              <QuestionBankEditor
                value={form.questionItems}
                onChange={(questionItems) => setForm((f) => ({ ...f, questionItems }))}
                disabled={loading}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-300">
                Hủy
              </button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                {editingId ? 'Lưu thay đổi' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
