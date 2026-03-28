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
  const [err, setErr] = useState(null)
  const [submittingId, setSubmittingId] = useState(null)

  const token = session?.access_token

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
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const [aRes, sRes] = await Promise.all([
        getMyAssignments(token),
        getMyAssignmentSubmissions(token),
      ])
      setAssignments(aRes.data || [])
      setSubmissions(sRes.data || [])
    } catch (e) {
      setErr(e.message || 'Không tải được bài tập')
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
      alert(e.message || 'Không gửi được')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bài tập"
        description="Danh sách từ API /api/me/assignments — chỉ hiển thị lớp bạn được ghi danh."
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
      {err && <p className="text-sm text-red-400">{err}</p>}

      {!loading && !err && assignments.length === 0 && (
        <EmptyState
          icon="📝"
          title="Chưa có bài tập"
          description="Khi giáo viên giao bài trong lớp của bạn, mục sẽ hiển thị tại đây."
        />
      )}

      <div className="space-y-4">
        {assignments.map((a) => {
          const sub = byAssignmentId[a.id]
          const className = a.classes?.name || `Lớp #${a.class_id}`
          const pending = sub?.status === 'pending'
          const graded = sub?.status === 'graded'
          return (
            <Panel key={a.id} noDivider className="border-white/10" padding>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-400/90">{className}</p>
                  <h3 className="mt-1 font-semibold text-white">{a.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">Hạn: {formatDue(a.due_at)}</p>
                  {sub && (
                    <p className="mt-2 text-sm text-slate-300">
                      {graded && sub.score != null
                        ? `Đã chấm: ${sub.score} điểm`
                        : pending
                          ? 'Đã nộp — chờ chấm'
                          : `Trạng thái: ${sub.status}`}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {!sub ? (
                    <button
                      type="button"
                      disabled={submittingId === a.id}
                      onClick={() => submit(a.id)}
                      className={btnPrimaryStudent}
                    >
                      {submittingId === a.id ? 'Đang gửi…' : 'Xác nhận đã nộp'}
                    </button>
                  ) : (
                    <span className="inline-block rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-400">
                      Đã ghi nhận
                    </span>
                  )}
                </div>
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
