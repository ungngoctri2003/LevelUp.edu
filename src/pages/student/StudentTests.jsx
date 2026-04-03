import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import EmptyState from '../../components/dashboard/EmptyState'
import { btnPrimaryStudent, tableHeadAdmin } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { getMyAssignedExams, getMyExamAttempts } from '../../services/meApi.js'

function formatDate(iso) {
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

export default function StudentTests() {
  const { user, session } = useAuthSession()
  const [assignedExams, setAssignedExams] = useState([])
  const [needsEnrollment, setNeedsEnrollment] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)

  useEffect(() => {
    const token = session?.access_token
    if (!token || !user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setHistoryError(false)
      try {
        const attemptsRes = await getMyExamAttempts(token, 100)
        if (cancelled) return
        setRows(attemptsRes?.data || [])
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setHistoryError(true)
        }
      }
      try {
        const examsRes = await getMyAssignedExams(token)
        if (cancelled) return
        const raw = examsRes?.data || []
        setAssignedExams(raw.map(mapExamRow).filter(Boolean))
        setNeedsEnrollment(!!examsRes?.meta?.needsEnrollment)
      } catch (e) {
        if (!cancelled) {
          setAssignedExams([])
          setNeedsEnrollment(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, session?.access_token])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kiểm tra"
        description="Đề được giao cho lớp bạn làm tại trang Bài kiểm tra; bảng bên dưới là lịch sử điểm sau khi nộp."
      >
        <Link to="/bai-kiem-tra" className={btnPrimaryStudent}>
          Mở trang làm bài
        </Link>
      </PageHeader>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

      {!loading && (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400/90">Đề được giao</h2>
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
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-400/90">Lịch sử làm bài</h2>
            {historyError ? (
              <p className="text-sm text-amber-200/90">
                Không tải được lịch sử. Kiểm tra kết nối hoặc tải lại trang.
              </p>
            ) : rows.length === 0 ? (
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
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-white/[0.03]">
                          <td className="px-4 py-3 font-medium">{r.exams?.title || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-sky-300">
                            {r.score}/{r.max_score}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {r.correct_count ?? '—'}/{r.total_count ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(r.completed_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </section>
        </>
      )}
    </div>
  )
}
