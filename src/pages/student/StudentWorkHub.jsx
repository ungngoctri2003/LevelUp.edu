import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import EmptyState from '../../components/dashboard/EmptyState'
import { btnPrimaryStudent, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import {
  getMyAssignments,
  getMyAssignmentSubmissions,
  postMyAssignmentSubmission,
  getMyAssignedExams,
  getMyExamAttempts,
} from '../../services/meApi.js'
import { PUBLIC_LOAD_ERROR, PUBLIC_SUBMIT_ERROR } from '../../lib/publicUserMessages.js'
import { normalizeMcqForTaking } from '../../lib/mcqQuestions.js'
import { toast } from 'sonner'

const SECTION_ASSIGNMENTS_ID = 'student-section-bai-tap'
const SECTION_TESTS_ID = 'student-section-kiem-tra'

function formatDue(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatExamDate(iso) {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function mapExamRow(e) {
  if (!e) return null
  return {
    id: e.id,
    title: e.title,
    subject: e.subject_label,
    duration: e.duration_minutes,
    questions: e.question_count,
    level: e.level_label || '',
    contentMode: e.content_mode === 'embed' ? 'embed' : 'mcq',
  }
}

export default function StudentWorkHub() {
  const location = useLocation()
  const { user, session } = useAuthSession()
  const [searchParams] = useSearchParams()
  const assignmentFocusParam = searchParams.get('assignment') || ''
  const token = session?.access_token

  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [asgLoading, setAsgLoading] = useState(true)
  const [asgLoadFailed, setAsgLoadFailed] = useState(false)
  const [submittingId, setSubmittingId] = useState(null)
  const [mcqDraft, setMcqDraft] = useState({})
  const [highlightAssignmentId, setHighlightAssignmentId] = useState(null)

  const [assignedExams, setAssignedExams] = useState([])
  const [needsEnrollment, setNeedsEnrollment] = useState(false)
  const [examRows, setExamRows] = useState([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)

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

  const loadAssignments = useCallback(async () => {
    if (!token || !user?.id) {
      setAssignments([])
      setSubmissions([])
      setAsgLoadFailed(false)
      setAsgLoading(false)
      return
    }
    setAsgLoading(true)
    setAsgLoadFailed(false)
    try {
      const [aRes, sRes] = await Promise.all([
        getMyAssignments(token),
        getMyAssignmentSubmissions(token),
      ])
      setAssignments(aRes.data || [])
      setSubmissions(sRes.data || [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentWorkHub assignments]', e)
      toast.error(PUBLIC_LOAD_ERROR)
      setAsgLoadFailed(true)
      setAssignments([])
      setSubmissions([])
    } finally {
      setAsgLoading(false)
    }
  }, [token, user?.id])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  useEffect(() => {
    if (!assignmentFocusParam || asgLoading) return
    const idNum = Number(assignmentFocusParam)
    if (!Number.isFinite(idNum)) return
    const found = assignments.some((a) => Number(a.id) === idNum)
    if (!found) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`student-asg-${idNum}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setHighlightAssignmentId(idNum)
        window.setTimeout(() => setHighlightAssignmentId(null), 2600)
      }
    }, 80)
    return () => window.clearTimeout(t)
  }, [assignmentFocusParam, asgLoading, assignments])

  useEffect(() => {
    if (location.hash !== `#${SECTION_TESTS_ID}`) return
    const t = window.setTimeout(() => {
      document.getElementById(SECTION_TESTS_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(t)
  }, [location.hash, examsLoading])

  useEffect(() => {
    if (!token || !user?.id) {
      setExamsLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setExamsLoading(true)
      setHistoryError(false)
      try {
        const attemptsRes = await getMyExamAttempts(token, 100)
        if (cancelled) return
        setExamRows(attemptsRes?.data || [])
      } catch {
        if (!cancelled) {
          setExamRows([])
          setHistoryError(true)
        }
      }
      try {
        const examsRes = await getMyAssignedExams(token)
        if (cancelled) return
        const raw = examsRes?.data || []
        setAssignedExams(raw.map(mapExamRow).filter(Boolean))
        setNeedsEnrollment(!!examsRes?.meta?.needsEnrollment)
      } catch {
        if (!cancelled) {
          setAssignedExams([])
          setNeedsEnrollment(false)
        }
      } finally {
        if (!cancelled) setExamsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, token])

  const submit = async (assignmentId) => {
    if (!token) return
    setSubmittingId(assignmentId)
    try {
      await postMyAssignmentSubmission(token, { assignment_id: assignmentId, status: 'pending' })
      await loadAssignments()
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentWorkHub submit]', e)
      toast.error(PUBLIC_SUBMIT_ERROR)
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
      await loadAssignments()
      toast.success('Đã nộp bài. Điểm được chấm tự động.')
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentWorkHub submitMcq]', e)
      toast.error(PUBLIC_SUBMIT_ERROR)
    } finally {
      setSubmittingId(null)
    }
  }

  const assignmentsBusy = asgLoading
  const testsBusy = examsLoading

  return (
    <div className="space-y-10">
      <PageHeader
        title="Bài tập & kiểm tra"
        description="Phía trên: bài tập theo lớp do giáo viên giao. Phía dưới: đề kiểm tra kho và lịch sử điểm — làm bài tại trang Bài kiểm tra công khai."
      >
        <Link to="/bai-kiem-tra" className={btnPrimaryStudent}>
          Mở trang làm bài
        </Link>
      </PageHeader>

      <section id={SECTION_ASSIGNMENTS_ID} className="space-y-4 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Bài tập theo lớp</h2>
        {assignmentsBusy && <p className="text-sm text-slate-400">Đang tải…</p>}

        {!assignmentsBusy && asgLoadFailed && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p>Không tải được danh sách bài tập. Kiểm tra mạng hoặc đăng nhập lại.</p>
            <button
              type="button"
              onClick={() => loadAssignments()}
              className="mt-2 text-sky-300 underline hover:text-sky-200"
            >
              Thử lại
            </button>
          </div>
        )}

        {!assignmentsBusy && !asgLoadFailed && assignments.length === 0 && (
          <EmptyState
            icon="📝"
            title="Chưa có bài tập"
            description="Cần được ghi danh đúng lớp và giáo viên giao bài tại Khu giáo viên. Đề kiểm tra kho chung nằm ở mục Kiểm tra bên dưới hoặc trang Bài kiểm tra."
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
              <Panel
                key={a.id}
                id={`student-asg-${a.id}`}
                noDivider
                className={`border-white/10 ${highlightAssignmentId === Number(a.id) ? 'ring-2 ring-inset ring-sky-400/45' : ''}`}
                padding
              >
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
                      <div key={`${a.id}-q-${idx}-${q.sourceIndex}`} className="space-y-2">
                        <p className="text-sm font-medium text-white">
                          Câu {idx + 1}: {q.text}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={`${a.id}-${q.sourceIndex}-opt-${optIdx}`}
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
      </section>

      <div className="border-t border-white/10 pt-10" />

      <section id={SECTION_TESTS_ID} className="space-y-6 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Kiểm tra</h2>
        {testsBusy && <p className="text-sm text-slate-400">Đang tải…</p>}

        {!testsBusy && (
          <>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Đề được giao</h3>
              {needsEnrollment && assignedExams.length === 0 ? (
                <EmptyState
                  icon="🏫"
                  title="Chưa ghi danh lớp"
                  description="Khi được thêm vào lớp, đề do giáo viên/trung tâm giao sẽ hiển thị tại đây và tại trang Bài kiểm tra."
                />
              ) : assignedExams.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="Chưa có đề được giao"
                  description="Giáo viên giao đề từ kho hoặc trung tâm bật giao đề — bạn sẽ thấy danh sách tại đây."
                >
                  <Link to="/bai-kiem-tra" className={btnPrimaryStudent}>
                    Kiểm tra trang làm bài
                  </Link>
                </EmptyState>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assignedExams.map((ex) => (
                    <Panel key={ex.id} noDivider className="border-white/10" padding>
                      <p className="text-xs font-medium uppercase text-sky-400/80">{ex.subject}</p>
                      <h3 className="mt-1 font-semibold text-white">{ex.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">
                        ⏱ {ex.duration} phút ·{' '}
                        {ex.contentMode === 'embed' ? 'Tương tác / nhúng' : `${ex.questions} câu`} · {ex.level}
                      </p>
                      <Link
                        to={`/bai-kiem-tra?exam=${ex.id}`}
                        className={`${btnPrimaryStudent} mt-4 inline-block text-center`}
                      >
                        Làm bài
                      </Link>
                    </Panel>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lịch sử làm bài</h3>
              {historyError ? (
                <p className="text-sm text-amber-200/90">
                  Không tải được lịch sử. Kiểm tra kết nối hoặc tải lại trang.
                </p>
              ) : examRows.length === 0 ? (
                <EmptyState
                  icon="📝"
                  title="Chưa có lần nộp nào"
                  description="Sau khi bạn làm và nộp bài tại trang Bài kiểm tra, điểm sẽ hiển thị ở đây."
                />
              ) : (
                <Panel noDivider padding={false} className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className={tableHeadAdmin}>
                        <tr>
                          <th className="px-4 py-3">Đề</th>
                          <th className="px-4 py-3">Điểm</th>
                          <th className="px-4 py-3">Đúng / Tổng</th>
                          <th className="px-4 py-3">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-200">
                        {examRows.map((r) => (
                          <tr key={r.id} className="hover:bg-white/[0.03]">
                            <td className="px-4 py-3 font-medium">{r.exams?.title || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-sky-300">
                              {r.score}/{r.max_score}
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {r.correct_count ?? '—'}/{r.total_count ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{formatExamDate(r.completed_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
