import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthSession } from '../context/AuthSessionContext'
import { usePublicContent } from '../hooks/usePublicContent'
import { fetchPublicExamById, normalizeExamQuestions } from '../services/publicApi.js'
import { postMyExamAttempt } from '../services/meApi.js'
import { toast } from 'sonner'

export default function TestsPage() {
  const { exams, loading: examsLoading } = usePublicContent()
  const { user, session } = useAuthSession()
  const [selectedExam, setSelectedExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const handleStartExam = async (exam) => {
    setLoadingQuestions(true)
    try {
      const detail = await fetchPublicExamById(exam.id)
      const qs = normalizeExamQuestions(detail?.questions)
      if (!qs.length) {
        toast.warning('Đề này chưa có câu hỏi. Vui lòng chọn đề khác hoặc liên hệ quản trị.')
        return
      }
      setSelectedExam({ ...exam, questions: qs })
      setAnswers({})
      setSubmitted(false)
      setResult(null)
    } finally {
      setLoadingQuestions(false)
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
                onClick={() => setSelectedExam(null)}
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
                    {q.options.map((opt) => (
                      <label
                        key={opt}
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
                onClick={() => setSelectedExam(null)}
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
    return (
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl border border-transparent bg-white p-10 text-center shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
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
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedExam(null)
                  setSubmitted(false)
                  setResult(null)
                }}
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

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Bài kiểm tra
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Câu hỏi lấy từ CSDL theo từng đề. Học viên đăng nhập được lưu điểm qua API máy chủ.
          </p>
        </div>

        {loadingQuestions && (
          <p className="mb-6 text-center text-sm text-slate-500">Đang tải câu hỏi đề…</p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examsLoading && <p className="col-span-full text-center text-slate-500">Đang tải đề…</p>}
          {!examsLoading && exams.length === 0 && (
            <p className="col-span-full text-center text-slate-500">
              Chưa có đề công khai. Admin có thể thêm đề tại khu vực quản trị.
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
                <span>📝 {exam.questions} câu</span>
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
