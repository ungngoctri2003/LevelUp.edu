import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import EmptyState from '../../components/dashboard/EmptyState'
import { btnPrimaryStudent } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { usePublicContent } from '../../hooks/usePublicContent'
import ClassPaymentModal from '../../components/ClassPaymentModal.jsx'
import { ModalPortal } from '../../components/dashboard/ModalPortal'
import {
  getMyClassLessonPosts,
  getMyClasses,
  getMyClassTeacherRequests,
  getMyPayments,
  postMyClassTeacherRequest,
} from '../../services/meApi.js'
import { PUBLIC_LOAD_ERROR, PUBLIC_SUBMIT_ERROR } from '../../lib/publicUserMessages.js'
import { toast } from 'sonner'
import StudentClassSchedule from './StudentClassSchedule'
import StudentWorkHub from './StudentWorkHub'
import PageLoading from '../../components/ui/PageLoading.jsx'

const H = {
  BAI_GIANG: 'student-section-bai-giang',
  LOP: 'student-section-lop',
  LICH: 'student-section-lich-lop',
  BAI_TAP: 'student-section-bai-tap',
  KIEM_TRA: 'student-section-kiem-tra',
  THANH_TOAN: 'student-section-thanh-toan',
  MO_BAN: 'student-section-lop-mo-ban',
}

function resolvePanelHash(raw, hasMoBan) {
  const h = (raw || '').replace(/^#/, '').trim()
  const valid = new Set([
    H.BAI_GIANG,
    H.LOP,
    H.LICH,
    H.BAI_TAP,
    H.KIEM_TRA,
    H.THANH_TOAN,
  ])
  if (hasMoBan) valid.add(H.MO_BAN)
  if (valid.has(h)) return h
  return H.LOP
}

const tabBtn =
  'rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 whitespace-nowrap'

const classPayStatusToneClass = {
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  sky: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
  slate: 'border-gray-200 bg-slate-100 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-300',
  violet: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
}

function getClassPaymentRowStatus(p, myClasses) {
  const cid = Number(p.class_id)
  const enrolled = (myClasses || []).some((c) => Number(c.class_id) === cid)
  if (enrolled) return { tone: 'emerald', label: 'Đã ghi danh' }
  if (p.payment_status === 'paid') return { tone: 'cyan', label: 'Đã thanh toán — chờ ghi danh' }
  if (p.payment_status === 'pending') return { tone: 'amber', label: 'Chờ xác nhận thanh toán' }
  if (p.payment_status === 'cancelled') return { tone: 'rose', label: 'Đã hủy' }
  return { tone: 'slate', label: String(p.payment_status || '—') }
}

function classModalTitle(row) {
  if (!row) return ''
  const code = typeof row.class_code === 'string' ? row.class_code.trim() : ''
  return code ? `${row.class_name} (${code})` : row.class_name
}

function formatResolvedAt(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return ''
  }
}

function paymentRowToClassModalShape(p) {
  return {
    id: p.class_id,
    class_name: p.class_name,
    class_code: p.class_code,
    tuition_fee: p.amount != null && Number.isFinite(Number(p.amount)) ? Number(p.amount) : null,
  }
}

export default function StudentLearningHub() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, session } = useAuthSession()
  const { saleClasses } = usePublicContent()
  const [classes, setClasses] = useState([])
  const [payments, setPayments] = useState([])
  const [classPosts, setClassPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [payModalClass, setPayModalClass] = useState(null)
  const [teacherChangeRequests, setTeacherChangeRequests] = useState([])
  const [teacherReqModal, setTeacherReqModal] = useState(null)
  const [teacherReqNote, setTeacherReqNote] = useState('')
  const [teacherReqSubmitting, setTeacherReqSubmitting] = useState(false)

  const [mounted, setMounted] = useState(() => {
    if (typeof window === 'undefined') return { schedule: false, work: false }
    const h = window.location.hash.replace(/^#/, '').trim()
    return {
      schedule: h === H.LICH,
      work: h === H.BAI_TAP || h === H.KIEM_TRA,
    }
  })

  const load = useCallback(async () => {
    const token = session?.access_token
    if (!token || user?.dbRole !== 'student') {
      setClasses([])
      setPayments([])
      setClassPosts([])
      setTeacherChangeRequests([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [classesRes, paymentsRes, postsRes, reqRes] = await Promise.all([
        getMyClasses(token),
        getMyPayments(token),
        getMyClassLessonPosts(token),
        getMyClassTeacherRequests(token).catch(() => ({ data: [] })),
      ])
      setClasses(Array.isArray(classesRes?.data) ? classesRes.data : [])
      setPayments(Array.isArray(paymentsRes?.data) ? paymentsRes.data : [])
      setClassPosts(Array.isArray(postsRes?.data) ? postsRes.data : [])
      setTeacherChangeRequests(Array.isArray(reqRes?.data) ? reqRes.data : [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentLearningHub]', e)
      toast.error(PUBLIC_LOAD_ERROR)
      setClasses([])
      setPayments([])
      setClassPosts([])
      setTeacherChangeRequests([])
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, user?.dbRole])

  useEffect(() => {
    load()
  }, [load])

  const saleRecommendations = useMemo(() => {
    const activeClassIds = new Set(classes.map((row) => Number(row.class_id)))
    return saleClasses.filter((row) => !activeClassIds.has(Number(row.id))).slice(0, 6)
  }, [classes, saleClasses])

  const showMoBanTab = saleRecommendations.length > 0
  const activeHash = resolvePanelHash(location.hash, showMoBanTab)

  useEffect(() => {
    const h = resolvePanelHash(location.hash, showMoBanTab)
    setMounted((m) => ({
      schedule: m.schedule || h === H.LICH,
      work: m.work || h === H.BAI_TAP || h === H.KIEM_TRA,
    }))
  }, [location.hash, showMoBanTab])

  /** Mỗi lớp đã ghi danh + danh sách bài giảng trong lớp (teacher_lesson_posts). */
  const lessonsByEnrolledClass = useMemo(() => {
    if (!classes.length) return []
    const postsByClass = new Map()
    for (const p of classPosts) {
      const cid = Number(p.class_id)
      if (!Number.isFinite(cid)) continue
      if (!postsByClass.has(cid)) postsByClass.set(cid, [])
      postsByClass.get(cid).push(p)
    }
    for (const arr of postsByClass.values()) {
      arr.sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
    }
    return classes.map((c) => ({
      classId: c.class_id,
      className: c.class_name,
      classCode: c.class_code || '',
      subject: c.subject,
      grade_label: c.grade_label,
      items: postsByClass.get(Number(c.class_id)) ?? [],
    }))
  }, [classes, classPosts])

  const pendingTeacherChangeByClassId = useMemo(() => {
    const m = new Map()
    for (const r of teacherChangeRequests) {
      if (r.status === 'pending' && r.class_id != null) {
        m.set(Number(r.class_id), r)
      }
    }
    return m
  }, [teacherChangeRequests])

  /** Mỗi lớp: bản ghi yêu cầu mới nhất (API đã sắp created_at giảm dần). */
  const latestTeacherChangeByClassId = useMemo(() => {
    const m = new Map()
    for (const r of teacherChangeRequests) {
      if (r.class_id == null) continue
      const cid = Number(r.class_id)
      if (!Number.isFinite(cid) || m.has(cid)) continue
      m.set(cid, r)
    }
    return m
  }, [teacherChangeRequests])

  const classPaymentRows = useMemo(() => {
    if (user?.dbRole !== 'student') return []
    const latestByClass = new Map()
    for (const p of payments) {
      const cid = Number(p.class_id)
      if (!Number.isFinite(cid)) continue
      const prev = latestByClass.get(cid)
      if (!prev || String(p.submitted_at || '') > String(prev.submitted_at || '')) {
        latestByClass.set(cid, p)
      }
    }
    return [...latestByClass.values()].sort((a, b) =>
      String(a.class_name || '').localeCompare(String(b.class_name || ''), 'vi'),
    )
  }, [user?.dbRole, payments])

  const tabItems = useMemo(() => {
    const items = [
      { id: H.BAI_GIANG, label: 'Bài giảng' },
      { id: H.LOP, label: 'Lớp đã kích hoạt' },
      { id: H.LICH, label: 'Lịch lớp' },
      { id: H.BAI_TAP, label: 'Bài tập' },
      { id: H.KIEM_TRA, label: 'Kiểm tra' },
      { id: H.THANH_TOAN, label: 'Thanh toán lớp' },
    ]
    if (showMoBanTab) items.push({ id: H.MO_BAN, label: 'Lớp mở bán' })
    return items
  }, [showMoBanTab])

  const goTab = (hashId) => {
    navigate({ pathname: location.pathname, search: location.search, hash: `#${hashId}` }, { replace: true })
  }

  const openTeacherReqModal = (row) => {
    setTeacherReqNote('')
    setTeacherReqModal({
      class_id: row.class_id,
      class_name: row.class_name,
      teacher_name: row.teacher_name,
    })
  }

  const submitTeacherChangeRequest = async (e) => {
    e.preventDefault()
    const token = session?.access_token
    const cid = teacherReqModal?.class_id
    if (!token || cid == null) return
    setTeacherReqSubmitting(true)
    try {
      await postMyClassTeacherRequest(token, {
        class_id: Number(cid),
        student_note: teacherReqNote.trim() || undefined,
      })
      toast.success('Đã gửi yêu cầu. Trung tâm sẽ xem xét và liên hệ khi cần.')
      setTeacherReqModal(null)
      await load()
    } catch (err) {
      if (import.meta.env.DEV) console.error('[StudentLearningHub] teacher request', err)
      toast.error(err?.message || PUBLIC_SUBMIT_ERROR)
    } finally {
      setTeacherReqSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lớp học của tôi"
        description="Bài giảng theo từng lớp đã ghi danh, lịch, bài tập, kiểm tra; tab Thanh toán lớp cho học phí. Khóa học online xem thêm trên trang Bài giảng."
      />

      {loading && <PageLoading variant="inline" />}

      {!loading && user?.dbRole !== 'student' && (
        <Panel title="Tài khoản hiện tại">
          <p className="text-sm text-slate-400">Chỉ tài khoản học viên mới xem được danh sách lớp học đã kích hoạt.</p>
        </Panel>
      )}

      {!loading && user?.dbRole === 'student' && (
        <>
          <ClassPaymentModal
            open={!!payModalClass}
            onClose={() => setPayModalClass(null)}
            classId={payModalClass?.id}
            classTitle={classModalTitle(payModalClass)}
            tuitionFee={payModalClass?.tuition_fee ?? null}
            onSubmitted={load}
          />
          {teacherReqModal && (
            <ModalPortal>
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="teacher-req-title"
                onClick={(ev) => {
                  if (ev.target === ev.currentTarget) setTeacherReqModal(null)
                }}
              >
                <div
                  className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-900"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setTeacherReqModal(null)}
                    className="absolute right-4 top-4 rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                  <h2 id="teacher-req-title" className="pr-10 text-xl font-bold text-gray-900 dark:text-white">
                    Yêu cầu đổi giáo viên
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                    Lớp:{' '}
                    <span className="font-semibold text-gray-900 dark:text-slate-200">{teacherReqModal.class_name}</span>
                    <span className="text-slate-500 dark:text-slate-500">
                      {' '}
                      · GV hiện tại: {teacherReqModal.teacher_name}
                    </span>
                  </p>
                  <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
                    Trung tâm sẽ xem xét yêu cầu. Việc đổi giáo viên do quản trị thực hiện trên hệ thống sau khi đồng ý.
                  </p>
                  <form onSubmit={submitTeacherChangeRequest} className="mt-6 grid gap-3">
                    <label className="text-sm text-gray-700 dark:text-slate-300">
                      Lý do hoặc ghi chú (tuỳ chọn)
                      <textarea
                        rows={4}
                        value={teacherReqNote}
                        onChange={(ev) => setTeacherReqNote(ev.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                        placeholder="Ví dụ: mong muốn đổi giờ / phong cách dạy…"
                        maxLength={2000}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTeacherReqModal(null)}
                        className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 dark:border-slate-600 dark:text-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={teacherReqSubmitting}
                        className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                      >
                        {teacherReqSubmitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </ModalPortal>
          )}
          <div
            role="tablist"
            aria-label="Nội dung lớp học"
            className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-white/10"
          >
            {tabItems.map((tab) => {
              const isActive = activeHash === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  id={`hub-tab-${tab.id}`}
                  onClick={() => goTab(tab.id)}
                  className={`${tabBtn} shrink-0 border-b-2 border-transparent ${
                    isActive
                      ? 'border-sky-500 text-sky-700 dark:border-sky-400 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="min-h-[12rem]" role="tabpanel" aria-labelledby={`hub-tab-${activeHash}`}>
            {activeHash === H.BAI_GIANG && (
              <section id={H.BAI_GIANG} className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400/90">Bài giảng theo lớp</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Nội dung do giáo viên đăng trong từng lớp bạn đã ghi danh. Khóa học trực tuyến xem tại{' '}
                  <Link to="/bai-giang" className="font-semibold text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
                    trang Bài giảng
                  </Link>
                  .
                </p>
                {classes.length === 0 ? (
                  <EmptyState
                    icon="📘"
                    title="Chưa có lớp được kích hoạt"
                    description="Sau khi ghi danh lớp, bài giảng do giáo viên đăng sẽ hiển thị theo từng lớp tại đây."
                  />
                ) : (
                  <div className="space-y-6">
                    {lessonsByEnrolledClass.map((block) => (
                      <Panel key={String(block.classId)} noDivider padding>
                        <div className="border-b border-gray-200 pb-3 dark:border-white/10">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{block.className}</h3>
                          {block.classCode ? (
                            <p className="mt-0.5 font-mono text-xs text-slate-500">{block.classCode}</p>
                          ) : null}
                          <p className="mt-1 text-sm text-slate-400">
                            {block.subject} · {block.grade_label}
                          </p>
                        </div>
                        {block.items.length === 0 ? (
                          <p className="mt-4 text-sm text-slate-400">
                            Chưa có bài giảng nào trong lớp này — giáo viên có thể đăng sau.
                          </p>
                        ) : (
                          <ul className="mt-4 divide-y divide-gray-200 dark:divide-white/10">
                            {block.items.map((post) => (
                              <li key={post.id}>
                                <Link
                                  to={`/bai-giang/lop/${post.id}`}
                                  className="flex flex-wrap items-start justify-between gap-3 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                                >
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white">{post.title}</p>
                                    <p className="mt-1 text-sm text-slate-400">
                                      {post.duration_display}
                                      {post.subject ? ` · ${post.subject}` : ''}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-sm font-medium text-sky-600 dark:text-sky-400">Xem →</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Panel>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeHash === H.LOP && (
              <section id={H.LOP} className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400/90">Lớp đã kích hoạt</h2>
                {classes.length === 0 ? (
                  <EmptyState
                    icon="🎓"
                    title="Chưa có lớp nào được kích hoạt"
                    description="Sau khi trung tâm xác nhận thanh toán và ghi danh, lớp học của bạn sẽ xuất hiện tại đây."
                  />
                ) : (
                  <div className="grid gap-4">
                    {classes.map((row) => {
                      const pendingReq = pendingTeacherChangeByClassId.get(Number(row.class_id))
                      const latestReq = latestTeacherChangeByClassId.get(Number(row.class_id))
                      const st = String(latestReq?.status || '')
                      const showResolvedFeedback = latestReq && ['approved', 'rejected', 'cancelled'].includes(st)
                      return (
                      <Panel key={row.class_id} noDivider padding className="transition hover:border-sky-500/20">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{row.class_name}</h3>
                            <p className="mt-1 text-sm text-slate-400">
                              {row.subject} · {row.grade_label} · GV {row.teacher_name}
                            </p>
                            {row.schedule_summary && (
                              <p className="mt-2 text-sm text-slate-300">Lịch: {row.schedule_summary}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-200">
                              Đang học
                            </span>
                            {pendingReq ? (
                              <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                                Yêu cầu đổi GV: đang chờ xử lý
                              </span>
                            ) : null}
                            {!pendingReq && latestReq?.status === 'approved' ? (
                              <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                                Yêu cầu đổi GV: đã xử lý
                              </span>
                            ) : null}
                            {!pendingReq && latestReq?.status === 'rejected' ? (
                              <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100">
                                Yêu cầu đổi GV: không chấp nhận
                              </span>
                            ) : null}
                            {!pendingReq && latestReq?.status === 'cancelled' ? (
                              <span className="rounded-full border border-slate-500/35 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-300">
                                Yêu cầu đổi GV: đã hủy
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {showResolvedFeedback ? (
                          <div
                            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                              st === 'approved'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                : st === 'rejected'
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                  : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                            }`}
                          >
                            <p className="font-medium text-gray-900 dark:text-white">
                              {st === 'approved'
                                ? 'Trung tâm đã xử lý yêu cầu đổi giáo viên'
                                : st === 'rejected'
                                  ? 'Trung tâm không chấp nhận yêu cầu đổi giáo viên'
                                  : 'Yêu cầu đổi giáo viên đã được hủy'}
                            </p>
                            {latestReq.resolved_at ? (
                              <p className="mt-1 text-xs opacity-90">
                                Cập nhật: {formatResolvedAt(latestReq.resolved_at)}
                              </p>
                            ) : null}
                            {latestReq.admin_note ? (
                              <div className="mt-2 border-t border-white/10 pt-2 dark:border-white/10">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                                  Ghi chú từ trung tâm
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-slate-200">
                                  {latestReq.admin_note}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="mt-5 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Bài giảng</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{row.lesson_count}</p>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Bài tập</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{row.assignment_count}</p>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Bài kiểm tra</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{row.exam_count}</p>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-black/20">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Lịch buổi học</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{row.schedule_count}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <Link to={`/lop-hoc/${encodeURIComponent(String(row.class_id))}`} className={btnPrimaryStudent}>
                            Vào lớp
                          </Link>
                          <Link
                            to={`/hoc-vien/khoa-hoc#${H.BAI_TAP}`}
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                          >
                            Bài tập &amp; kiểm tra
                          </Link>
                          <Link
                            to={`/hoc-vien/khoa-hoc?lop=${encodeURIComponent(String(row.class_id))}#${H.LICH}`}
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                          >
                            Lịch học / meet
                          </Link>
                          <button
                            type="button"
                            disabled={!!pendingReq}
                            onClick={() => openTeacherReqModal(row)}
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                          >
                            Yêu cầu đổi giáo viên
                          </button>
                        </div>
                      </Panel>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {mounted.schedule && activeHash === H.LICH && (
              <section id={H.LICH} className="scroll-mt-24 space-y-4" tabIndex={-1}>
                <StudentClassSchedule embedded />
              </section>
            )}

            {mounted.work && (activeHash === H.BAI_TAP || activeHash === H.KIEM_TRA) && (
              <section
                id={activeHash === H.KIEM_TRA ? H.KIEM_TRA : H.BAI_TAP}
                className="scroll-mt-24 space-y-4"
                tabIndex={-1}
              >
                <StudentWorkHub
                  embedded
                  embeddedFocus={activeHash === H.KIEM_TRA ? 'exams' : 'assignments'}
                />
              </section>
            )}

            {activeHash === H.THANH_TOAN && (
              <section id={H.THANH_TOAN} className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400/90">
                  Trạng thái thanh toán lớp đã đăng ký
                </h2>
                <p className="text-sm text-slate-400">
                  Mỗi lớp hiển thị bản ghi thanh toán mới nhất. Đăng ký lớp mới tại{' '}
                  <Link to="/lop-hoc" className="font-semibold text-emerald-300 hover:text-emerald-200">
                    Lớp học (trang chủ)
                  </Link>
                  .
                </p>
                {classPaymentRows.length === 0 ? (
                  <Panel title="Chưa có yêu cầu thanh toán lớp" subtitle="Khi bạn gửi đăng ký / học phí lớp mở bán, trạng thái sẽ hiển thị tại đây.">
                    <p className="text-sm text-slate-400">
                      <Link to="/lop-hoc" className="font-semibold text-emerald-300 hover:text-emerald-200">
                        Xem lớp đang mở bán →
                      </Link>
                    </p>
                  </Panel>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-black/20 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full border-collapse text-left text-sm text-gray-800 dark:text-slate-200">
                        <thead>
                          <tr className="border-b border-gray-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
                            <th className="px-4 py-3 font-semibold text-slate-700 sm:px-5 dark:text-slate-300">Lớp</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 sm:px-5 dark:text-slate-300">Môn</th>
                            <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700 sm:px-5 dark:text-slate-300">Học phí</th>
                            <th className="px-4 py-3 font-semibold text-slate-700 sm:px-5 dark:text-slate-300">Trạng thái</th>
                            <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700 sm:px-5 dark:text-slate-300">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                          {classPaymentRows.map((p) => {
                            const status = getClassPaymentRowStatus(p, classes)
                            const amount =
                              p.amount != null && Number.isFinite(Number(p.amount)) ? Number(p.amount) : null
                            const enrolled = classes?.some((c) => Number(c.class_id) === Number(p.class_id))
                            return (
                              <tr key={`${p.class_id}-${p.id}`} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                                <td className="max-w-[240px] px-4 py-3 font-medium text-gray-900 sm:px-5 dark:text-white">
                                  <span className="line-clamp-2">{p.class_name}</span>
                                  {p.class_code ? (
                                    <span className="mt-0.5 block font-mono text-xs text-slate-500">{p.class_code}</span>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-slate-600 sm:px-5 dark:text-slate-300">{p.class_subject || '—'}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5 dark:text-slate-300">
                                  {amount != null ? `${amount.toLocaleString('vi-VN')}đ` : '—'}
                                </td>
                                <td className="px-4 py-3 sm:px-5">
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classPayStatusToneClass[status.tone]}`}
                                  >
                                    {status.label}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                                  {enrolled ? (
                                    <Link
                                      to={`/hoc-vien/khoa-hoc#${H.LOP}`}
                                      className="font-semibold text-emerald-300 hover:text-emerald-200"
                                    >
                                      Vào lớp
                                    </Link>
                                  ) : p.payment_status === 'pending' ? (
                                    <span className="text-xs text-slate-500">Chờ xác nhận</span>
                                  ) : p.payment_status === 'cancelled' ? (
                                    <button
                                      type="button"
                                      onClick={() => setPayModalClass(paymentRowToClassModalShape(p))}
                                      className="font-semibold text-amber-200 hover:text-amber-100"
                                    >
                                      Gửi lại
                                    </button>
                                  ) : p.payment_status === 'paid' ? (
                                    <span className="text-xs text-slate-500">Chờ ghi danh</span>
                                  ) : (
                                    <span className="text-xs text-slate-500">—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeHash === H.MO_BAN && showMoBanTab && (
              <section id={H.MO_BAN} className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400/90">Lớp đang mở bán</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {saleRecommendations.map((row) => (
                    <Panel key={row.id} noDivider padding>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{row.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {row.subject} · {row.grade_label} · GV {row.teacher_name}
                      </p>
                      {row.schedule_summary && <p className="mt-3 text-sm text-slate-300">Lịch: {row.schedule_summary}</p>}
                      <p className="mt-3 text-sm text-slate-300">
                        Học phí:{' '}
                        {row.tuition_fee != null ? `${row.tuition_fee.toLocaleString('vi-VN')}đ` : 'Liên hệ trung tâm'}
                      </p>
                      <Link
                        to="/lop-hoc"
                        className="mt-4 inline-flex rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                      >
                        Đăng ký / thanh toán lớp
                      </Link>
                    </Panel>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  )
}
