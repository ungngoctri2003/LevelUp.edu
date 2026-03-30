import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import EmptyState from '../../components/dashboard/EmptyState'
import { btnPrimaryStudent } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import {
  getMyAssignments,
  getMyAssignmentSubmissions,
  postMyAssignmentSubmission,
} from '../../services/meApi.js'
import { PUBLIC_LOAD_ERROR, PUBLIC_SUBMIT_ERROR } from '../../lib/publicUserMessages.js'
import { normalizeMcqForTaking } from '../../lib/mcqQuestions.js'
import { toast } from 'sonner'

function formatDue(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function StudentAssignments() {
  const { user, session } = useAuthSession()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [submittingId, setSubmittingId] = useState(null)
  const [mcqDraft, setMcqDraft] = useState({})

  const token = session?.access_token

  const setMcqPick = (assignmentId, sourceIndex, value) => {
    setMcqDraft((p) => ({
      ...p,
      [assignmentId]: { ...(p[assignmentId] || {}), [sourceIndex]: value },
    }))
  }

  const byAssignmentId = useMemo(() => {
    const m = {}
    for (const s of submissions) {
      m[s.assignment_id] = s
    }
    return m
  }, [submissions])

  const load = useCallback(async () => {
    if (!token || !user?.id) {
      setAssignments([])
      setSubmissions([])
      setLoadFailed(false)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadFailed(false)
    try {
      const [aRes, sRes] = await Promise.all([
        getMyAssignments(token),
        getMyAssignmentSubmissions(token),
      ])
      setAssignments(aRes.data || [])
      setSubmissions(sRes.data || [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentAssignments]', e)
      toast.error(PUBLIC_LOAD_ERROR)
      setLoadFailed(true)
      setAssignments([])
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [token, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (assignmentId) => {
    if (!token) return
    setSubmittingId(assignmentId)
    try {
      await postMyAssignmentSubmission(token, { assignment_id: assignmentId, status: 'pending' })
      await load()
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentAssignments submit]', e)
      toast.error(e?.message || PUBLIC_SUBMIT_ERROR)
    } finally {
      setSubmittingId(null)
    }
  }

  const submitMcq = async (assignment) => {
    if (!token) return
    const aid = assignment.id
    const taking = normalizeMcqForTaking(assignment.questions || [])
    const picked = mcqDraft[aid] || {}
    const answers = {}
    for (const t of taking) {
      answers[String(t.sourceIndex)] = picked[t.sourceIndex]
    }
    setSubmittingId(aid)
    try {
      await postMyAssignmentSubmission(token, {
        assignment_id: aid,
        status: 'pending',
        answers,
      })
      await load()
      toast.success('Đã nộp bài. Điểm được chấm tự động.')
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentAssignments submitMcq]', e)
      toast.error(e?.message || PUBLIC_SUBMIT_ERROR)
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bài tập"
        description="Bài do giáo viên tạo trong khu Giáo viên (bài tập theo lớp), khác với đề kiểm tra kho trung tâm."
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      {!loading && loadFailed && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p>Không tải được danh sách. Kiểm tra mạng hoặc đăng nhập lại.</p>
          <button type="button" onClick={() => load()} className="mt-2 text-sky-300 underline hover:text-sky-200">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !loadFailed && assignments.length === 0 && (
        <EmptyState
          icon="📝"
          title="Chưa có bài tập"
          description="Cần được ghi danh đúng lớp và giáo viên giao bài tại Khu giáo viên → Bài tập & kiểm tra (mục bài tập soạn riêng). Đề kiểm tra kho chung nằm ở Học viên → Kiểm tra hoặc trang Bài kiểm tra."
        />
      )}

      <div className="space-y-4">
        {assignments.map((a) => {
          const sub = byAssignmentId[a.id]
          const className = a.classes?.name || `Lớp #${a.class_id}`
          const pending = sub?.status === 'pending'
          const graded = sub?.status === 'graded'
          const taking = normalizeMcqForTaking(a.questions || [])
          const hasMcq = taking.length > 0
          const picked = mcqDraft[a.id] || {}
          return (
            <Panel key={a.id} noDivider className="border-white/10" padding>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-400/90">{className}</p>
                  <h3 className="mt-1 font-semibold text-white">{a.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">Hạn: {formatDue(a.due_at)}</p>
                  {hasMcq && !sub && (
                    <p className="mt-2 text-sm text-amber-200/90">
                      Bài có {taking.length} câu trắc nghiệm — chọn đáp án và nộp bài.
                    </p>
                  )}
                  {sub && (
                    <p className="mt-2 text-sm text-slate-300">
                      {graded && sub.score != null
                        ? sub.answers
                          ? `Chấm tự động: ${sub.score}/10 điểm`
                          : `Đã chấm: ${sub.score} điểm`
                        : pending
                          ? 'Đã nộp — chờ chấm'
                          : `Trạng thái: ${sub.status}`}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {!sub ? (
                    hasMcq ? (
                      <button
                        type="button"
                        disabled={submittingId === a.id}
                        onClick={() => submitMcq(a)}
                        className={btnPrimaryStudent}
                      >
                        {submittingId === a.id ? 'Đang gửi…' : 'Nộp bài'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submittingId === a.id}
                        onClick={() => submit(a.id)}
                        className={btnPrimaryStudent}
                      >
                        {submittingId === a.id ? 'Đang gửi…' : 'Xác nhận đã nộp'}
                      </button>
                    )
                  ) : (
                    <span className="inline-block rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-400">
                      Đã ghi nhận
                    </span>
                  )}
                </div>
              </div>
              {hasMcq && !sub && (
                <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
                  {taking.map((q, idx) => (
                    <div key={q.sourceIndex} className="space-y-2">
                      <p className="text-sm font-medium text-white">
                        Câu {idx + 1}: {q.text}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <label
                            key={`${q.sourceIndex}-${opt}`}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 hover:border-sky-500/40"
                          >
                            <input
                              type="radio"
                              name={`asg-${a.id}-q-${q.sourceIndex}`}
                              value={opt}
                              checked={picked[q.sourceIndex] === opt}
                              onChange={() => setMcqPick(a.id, q.sourceIndex, opt)}
                              className="h-4 w-4 text-sky-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
