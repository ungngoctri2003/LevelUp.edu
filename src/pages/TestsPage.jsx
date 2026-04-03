import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthSession } from '../context/AuthSessionContext'
import { normalizeExamQuestions } from '../services/publicApi.js'
import { getMyAssignedExamById, getMyAssignedExams, postMyExamAttempt } from '../services/meApi.js'
import { toast } from 'sonner'
import { PUBLIC_LOAD_ERROR } from '../lib/publicUserMessages.js'

function mapExamForCard(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    subject: row.subject_label,
    duration: row.duration_minutes,
    questions: row.question_count,
    level: row.level_label || '',
    assigned: !!row.assigned,
    published: row.published !== false,
    contentMode: row.content_mode === 'embed' ? 'embed' : 'mcq',
    embedSrc: typeof row.embed_src === 'string' ? row.embed_src : '',
  }
}

export default function TestsPage() {
  const { user, session, loading: authLoading } = useAuthSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [exams, setExams] = useState([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [needsEnrollment, setNeedsEnrollment] = useState(false)
  const [listForbidden, setListForbidden] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const clearExamFromUrl = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!next.has('exam')) return prev
        next.delete('exam')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const syncExamToUrl = useCallback(
    (examId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('exam', String(examId))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  /** Gán state làm bài từ payload API; false = không mở được (đề trống / không hợp lệ). */
  const applyLoadedExam = useCallback((examStub, detail) => {
    if (detail?.content_mode === 'embed' && detail?.embed_src) {
      setSelectedExam({
        ...examStub,
        title: detail.title || examStub.title,
        mode: 'embed',
        embedSrc: detail.embed_src,
        questions: [],
      })
      setAnswers({})
      setSubmitted(false)
      setResult(null)
      return true
    }
    const qs = normalizeExamQuestions(detail?.questions)
    if (!qs.length) {
      toast.warning('Đề này chưa có câu hỏi. Vui lòng chọn đề khác hoặc liên hệ quản trị.')
      return false
    }
    setSelectedExam({
      ...examStub,
      title: detail.title || examStub.title,
      mode: 'mcq',
      questions: qs,
    })
    setAnswers({})
    setSubmitted(false)
    setResult(null)
    return true
  }, [])

  useEffect(() => {
    let cancelled = false
    const token = session?.access_token
    if (authLoading) {
      setExamsLoading(true)
      return () => {
        cancelled = true
      }
    }
    if (!token || user?.dbRole !== 'student') {
      setExams([])
      setNeedsEnrollment(false)
      setListForbidden(false)
      setExamsLoading(false)
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      setExamsLoading(true)
      setListForbidden(false)
      try {
        const res = await getMyAssignedExams(token)
        if (cancelled) return
        const rows = res?.data || []
        setExams(rows.map(mapExamForCard).filter(Boolean))
        setNeedsEnrollment(!!res?.meta?.needsEnrollment)
      } catch (e) {
        if (cancelled) return
        setExams([])
        setNeedsEnrollment(false)
        if (e?.status === 403) setListForbidden(true)
      } finally {
        if (!cancelled) setExamsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, session?.access_token, user?.dbRole])

  const examQueryId = searchParams.get('exam')

  /** Mở đề theo `?exam=<id>` (ví dụ từ khu học viên). */
  useEffect(() => {
    if (authLoading) return
    const token = session?.access_token
    if (!token || user?.dbRole !== 'student') return
    const raw = examQueryId
    if (raw == null || raw === '') return
    const id = Number(raw)
    if (!Number.isFinite(id)) {
      clearExamFromUrl()
      return
    }
    if (selectedExam?.id === id) return

    let cancelled = false
    ;(async () => {
      setLoadingQuestions(true)
      try {
        const res = await getMyAssignedExamById(token, id)
        if (cancelled) return
        const detail = res?.data
        const ok = applyLoadedExam({ id }, detail)
        if (!ok) clearExamFromUrl()
      } catch (e) {
        if (cancelled) return
        if (import.meta.env.DEV) console.error('[TestsPage load exam from URL]', e)
        toast.error(PUBLIC_LOAD_ERROR)
        clearExamFromUrl()
      } finally {
        if (!cancelled) setLoadingQuestions(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    authLoading,
    session?.access_token,
    user?.dbRole,
    examQueryId,
    selectedExam?.id,
    applyLoadedExam,
    clearExamFromUrl,
  ])

  const handleStartExam = async (exam) => {
    const token = session?.access_token
    if (!token) {
      toast.error('Vui lòng đăng nhập tài khoản học viên.')
      return
    }
    setLoadingQuestions(true)
    try {
      const res = await getMyAssignedExamById(token, exam.id)
      const detail = res?.data
      const ok = applyLoadedExam(exam, detail)
      if (ok) syncExamToUrl(exam.id)
    } catch (e) {
      if (import.meta.env.DEV) console.error('[TestsPage load exam]', e)
      toast.error(PUBLIC_LOAD_ERROR)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const leaveExamView = () => {
    setSelectedExam(null)
    clearExamFromUrl()
  }

  const leaveExamViewFull = () => {
    setSelectedExam(null)
    setSubmitted(false)
    setResult(null)
    clearExamFromUrl()
  }

  const handleCompleteEmbed = async () => {
    const maxScore = 10
    const score = maxScore
    setResult({ correct: null, total: null, score, maxScore, embed: true })
    setSubmitted(true)

    const token = session?.access_token
    if (token && user?.id && selectedExam?.id != null) {
      try {
        await postMyExamAttempt(token, {
          exam_id: selectedExam.id,
          score,
          max_score: maxScore,
          correct_count: null,
          total_count: null,
        })
      } catch (e) {
        console.warn('[exam_attempts]', e.message)
      }
    }
  }

  const handleSubmitExam = async () => {
    const qs = selectedExam?.questions || []
    let correct = 0
    for (const q of qs) {
      if (answers[q.id] === q.answer) correct += 1
    }
    const total = qs.length
    const maxScore = 10
    const score = total > 0 ? Math.round((correct / total) * maxScore * 10) / 10 : 0

    setResult({ correct, total, score, maxScore })
    setSubmitted(true)

    const token = session?.access_token
    if (token && user?.id && selectedExam?.id != null) {
      try {
        await postMyExamAttempt(token, {
          exam_id: selectedExam.id,
          score,
          max_score: maxScore,
          correct_count: correct,
          total_count: total,
        })
      } catch (e) {
        console.warn('[exam_attempts]', e.message)
      }
    }
  }

  if (selectedExam && !submitted && selectedExam.mode === 'embed' && selectedExam.embedSrc) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
        <div className="flex w-full shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 sm:px-6 dark:border-slate-700">
          <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-gray-900 dark:text-white">
            {selectedExam.title}
          </h2>
          <button
            type="button"
            onClick={leaveExamView}
            className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← Quay lại
          </button>
        </div>
        <p className="shrink-0 border-b border-gray-100 px-4 py-2 text-xs text-gray-600 dark:border-slate-800 dark:text-slate-400 sm:px-6 sm:text-sm">
          Làm bài trong khung toàn màn hình. Khi xong, nhấn nút phía dưới để ghi nhận (học viên đăng nhập được lưu lịch sử).
        </p>
        <div className="relative min-h-0 w-full flex-1 bg-black/5 dark:bg-black/20">
          <iframe
            title={selectedExam.title}
            src={selectedExam.embedSrc}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            allow="fullscreen; autoplay; clipboard-write"
            loading="lazy"
          />
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-3 border-t border-gray-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
          <button
            type="button"
            onClick={handleCompleteEmbed}
            className="min-h-[48px] flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-6 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-95 sm:max-w-md sm:flex-none"
          >
            Đã hoàn thành — ghi nhận
          </button>
          <button
            type="button"
            onClick={leaveExamView}
            className="min-h-[48px] rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Hủy
          </button>
        </div>
      </div>
    )
  }

  if (selectedExam && !submitted) {
    const qs = selectedExam.questions || []
    return (
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-2xl border border-transparent bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedExam.title}</h2>
              <button
                type="button"
                onClick={leaveExamView}
                className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ← Quay lại
              </button>
            </div>

            <div className="space-y-8">
              {qs.map((q, idx) => (
                <div key={q.id} className="border-b border-gray-100 pb-6 dark:border-slate-700">
                  <p className="mb-3 font-medium text-gray-900 dark:text-white">
                    Câu {idx + 1}: {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <label
                        key={`${q.id}-opt-${optIdx}`}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-cyan-300 dark:border-slate-600 dark:hover:border-cyan-500/50"
                      >
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                          className="h-4 w-4 text-cyan-600"
                        />
                        <span className="text-gray-700 dark:text-slate-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="button"
                onClick={handleSubmitExam}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-4 font-semibold text-white shadow-md transition-opacity hover:opacity-95"
              >
                Nộp bài
              </button>
              <button
                type="button"
                onClick={leaveExamView}
                className="rounded-xl border border-gray-300 px-6 py-4 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedExam && submitted && result) {
    const isEmbed = !!result.embed
    return (
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl border border-transparent bg-white p-10 text-center shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
            {isEmbed ? (
              <>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/35">
                  <svg className="h-10 w-10 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Đã tiếp nhận thông tin</h3>
                <p className="mt-4 text-base leading-relaxed text-gray-700 dark:text-slate-300">
                  Hệ thống đã nhận được thông tin hoàn thành bài tương tác của bạn. Kết quả chi tiết sẽ được xử lý và trả về sau — vui lòng theo dõi thông báo hoặc khu học viên (nếu đã đăng nhập).
                </p>
                {user?.role === 'user' && session?.access_token && (
                  <p className="mt-4 text-sm text-fuchsia-600 dark:text-fuchsia-400">
                    Thông tin tham gia đã được lưu; bạn có thể xem lại tại &quot;Khu học viên → Kiểm tra&quot; khi có cập nhật.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Đã nộp bài</h3>
                <p className="mt-2 text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {result.score} / {result.maxScore} điểm
                </p>
                <p className="mt-2 text-gray-600 dark:text-slate-400">
                  Trả lời đúng {result.correct}/{result.total} câu
                </p>
                {user?.role === 'user' && session?.access_token && (
                  <p className="mt-3 text-sm text-fuchsia-600 dark:text-fuchsia-400">
                    Đã lưu vào &quot;Khu học viên → Kiểm tra&quot;.
                  </p>
                )}
              </>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={leaveExamViewFull}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-8 py-3 font-medium text-white shadow-md transition-opacity hover:opacity-95"
              >
                Về danh sách đề
              </button>
              {user?.role === 'user' && (
                <Link
                  to="/hoc-vien/bai-kiem-tra"
                  className="rounded-xl border border-gray-300 px-8 py-3 font-medium text-gray-800 dark:border-slate-600 dark:text-slate-200"
                >
                  Xem lịch sử điểm
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <p>Đang tải…</p>
      </div>
    )
  }

  if (!session?.access_token) {
    return (
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bài kiểm tra</h1>
          <p className="mt-4 text-gray-600 dark:text-slate-400">
            Chỉ học viên đã đăng nhập và được ghi danh lớp mới xem và làm các đề được trung tâm giao. Vui lòng đăng nhập bằng tài khoản học viên.
          </p>
          <Link
            to="/?auth=login"
            className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-8 py-3 font-medium text-white shadow-md"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  if (user?.dbRole !== 'student') {
    return (
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bài kiểm tra</h1>
          <p className="mt-4 text-gray-600 dark:text-slate-400">
            Trang này dành cho học viên. Tài khoản giáo viên hoặc quản trị không làm bài kiểm tra tại đây.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Bài kiểm tra
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Đề do trung tâm đăng và giáo viên giao cho lớp của bạn (hoặc đề chung đã bật giao). Cần đăng nhập học viên và đã ghi danh lớp.
          </p>
        </div>

        {loadingQuestions && (
          <p className="mb-6 text-center text-sm text-slate-500">Đang tải câu hỏi đề…</p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examsLoading && <p className="col-span-full text-center text-slate-500">Đang tải đề…</p>}
          {!examsLoading && listForbidden && (
            <p className="col-span-full text-center text-slate-500">
              Không thể tải danh sách đề. Vui lòng thử lại sau.
            </p>
          )}
          {!examsLoading &&
            !listForbidden &&
            needsEnrollment &&
            exams.length === 0 && (
              <p className="col-span-full text-center text-slate-500">
                Bạn chưa được ghi danh lớp nào. Liên hệ trung tâm để được giao bài kiểm tra.
              </p>
            )}
          {!examsLoading &&
            !listForbidden &&
            !needsEnrollment &&
            exams.length === 0 && (
              <p className="col-span-full text-center text-slate-500">
                Hiện chưa có đề nào được giao cho bạn. Khi trung tâm giao đề và bật đủ điều kiện, đề sẽ hiển thị tại đây.
              </p>
            )}
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-2xl border border-transparent bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/90"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-lg bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200">
                  {exam.subject}
                </span>
                {exam.assigned && (
                  <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    Đã giao
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-slate-400">
                <span>⏱ {exam.duration} phút</span>
                {exam.contentMode === 'embed' ? (
                  <span>🎮 Nội dung tương tác (nhúng)</span>
                ) : (
                  <span>📝 {exam.questions} câu</span>
                )}
                <span>📚 {exam.level}</span>
              </div>
              <button
                type="button"
                disabled={loadingQuestions}
                onClick={() => handleStartExam(exam)}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 py-3 font-medium text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingQuestions ? 'Đang tải…' : 'Làm bài'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
