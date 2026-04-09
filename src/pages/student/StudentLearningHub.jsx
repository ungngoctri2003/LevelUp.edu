import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader'
import Panel from '../../components/dashboard/Panel'
import EmptyState from '../../components/dashboard/EmptyState'
import { btnPrimaryStudent } from '../../components/dashboard/dashboardStyles'
import { useAuthSession } from '../../context/AuthSessionContext'
import { usePublicContent } from '../../hooks/usePublicContent'
import ClassPaymentModal from '../../components/ClassPaymentModal.jsx'
import { getMyClassLessonPosts, getMyClasses, getMyPayments } from '../../services/meApi.js'
import { PUBLIC_LOAD_ERROR } from '../../lib/publicUserMessages.js'
import { toast } from 'sonner'
import StudentClassSchedule from './StudentClassSchedule'
import StudentWorkHub from './StudentWorkHub'

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
  slate: 'border-white/15 bg-white/5 text-slate-300',
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
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [classesRes, paymentsRes, postsRes] = await Promise.all([
        getMyClasses(token),
        getMyPayments(token),
        getMyClassLessonPosts(token),
      ])
      setClasses(Array.isArray(classesRes?.data) ? classesRes.data : [])
      setPayments(Array.isArray(paymentsRes?.data) ? paymentsRes.data : [])
      setClassPosts(Array.isArray(postsRes?.data) ? postsRes.data : [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentLearningHub]', e)
      toast.error(PUBLIC_LOAD_ERROR)
      setClasses([])
      setPayments([])
      setClassPosts([])
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lớp học của tôi"
        description="Bài giảng theo từng lớp đã ghi danh, lịch, bài tập, kiểm tra; tab Thanh toán lớp cho học phí. Khóa học online xem thêm trên trang Bài giảng."
      />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}

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
          <div
            role="tablist"
            aria-label="Nội dung lớp học"
            className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                      ? 'border-sky-400 text-white'
                      : 'text-slate-400 hover:text-slate-200'
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
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Bài giảng theo lớp</h2>
                <p className="text-sm text-slate-400">
                  Nội dung do giáo viên đăng trong từng lớp bạn đã ghi danh. Khóa học trực tuyến (catalog) xem tại{' '}
                  <Link to="/bai-giang" className="font-semibold text-sky-400 hover:text-sky-300">
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
                        <div className="border-b border-white/10 pb-3">
                          <h3 className="text-lg font-semibold text-white">{block.className}</h3>
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
                          <ul className="mt-4 divide-y divide-white/10">
                            {block.items.map((post) => (
                              <li key={post.id}>
                                <Link
                                  to={`/bai-giang/lop/${post.id}`}
                                  className="flex flex-wrap items-start justify-between gap-3 py-4 transition-colors hover:bg-white/[0.04]"
                                >
                                  <div className="min-w-0">
                                    <p className="font-semibold text-white">{post.title}</p>
                                    <p className="mt-1 text-sm text-slate-400">
                                      {post.duration_display}
                                      {post.subject ? ` · ${post.subject}` : ''}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-sm font-medium text-sky-400">Xem →</span>
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
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Lớp đã kích hoạt</h2>
                {classes.length === 0 ? (
                  <EmptyState
                    icon="🎓"
                    title="Chưa có lớp nào được kích hoạt"
                    description="Sau khi trung tâm xác nhận thanh toán và ghi danh, lớp học của bạn sẽ xuất hiện tại đây."
                  />
                ) : (
                  <div className="grid gap-4">
                    {classes.map((row) => (
                      <Panel key={row.class_id} noDivider padding className="transition hover:border-sky-500/20">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-white">{row.class_name}</h3>
                            <p className="mt-1 text-sm text-slate-400">
                              {row.subject} · {row.grade_label} · GV {row.teacher_name}
                            </p>
                            {row.schedule_summary && (
                              <p className="mt-2 text-sm text-slate-300">Lịch: {row.schedule_summary}</p>
                            )}
                          </div>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-200">
                            Đang học
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Bài giảng</p>
                            <p className="mt-1 text-lg font-semibold text-white">{row.lesson_count}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Bài tập</p>
                            <p className="mt-1 text-lg font-semibold text-white">{row.assignment_count}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Bài kiểm tra</p>
                            <p className="mt-1 text-lg font-semibold text-white">{row.exam_count}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Lịch buổi học</p>
                            <p className="mt-1 text-lg font-semibold text-white">{row.schedule_count}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <Link to={`/lop-hoc/${encodeURIComponent(String(row.class_id))}`} className={btnPrimaryStudent}>
                            Vào lớp
                          </Link>
                          <Link
                            to={`/hoc-vien/khoa-hoc#${H.BAI_TAP}`}
                            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                          >
                            Bài tập &amp; kiểm tra
                          </Link>
                          <Link
                            to={`/hoc-vien/khoa-hoc?lop=${encodeURIComponent(String(row.class_id))}#${H.LICH}`}
                            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                          >
                            Lịch học / meet
                          </Link>
                        </div>
                      </Panel>
                    ))}
                  </div>
                )}
              </section>
            )}

            {mounted.schedule && activeHash === H.LICH && <StudentClassSchedule embedded />}

            {mounted.work && (activeHash === H.BAI_TAP || activeHash === H.KIEM_TRA) && (
              <StudentWorkHub
                embedded
                embeddedFocus={activeHash === H.KIEM_TRA ? 'exams' : 'assignments'}
              />
            )}

            {activeHash === H.THANH_TOAN && (
              <section id={H.THANH_TOAN} className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400/90">
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
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full border-collapse text-left text-sm text-slate-200">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.04]">
                            <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Lớp</th>
                            <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Môn</th>
                            <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-300 sm:px-5">Học phí</th>
                            <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Trạng thái</th>
                            <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-300 sm:px-5">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {classPaymentRows.map((p) => {
                            const status = getClassPaymentRowStatus(p, classes)
                            const amount =
                              p.amount != null && Number.isFinite(Number(p.amount)) ? Number(p.amount) : null
                            const enrolled = classes?.some((c) => Number(c.class_id) === Number(p.class_id))
                            return (
                              <tr key={`${p.class_id}-${p.id}`} className="transition-colors hover:bg-white/[0.04]">
                                <td className="max-w-[240px] px-4 py-3 font-medium text-white sm:px-5">
                                  <span className="line-clamp-2">{p.class_name}</span>
                                  {p.class_code ? (
                                    <span className="mt-0.5 block font-mono text-xs text-slate-500">{p.class_code}</span>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-slate-300 sm:px-5">{p.class_subject || '—'}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-slate-300 sm:px-5">
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
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Lớp đang mở bán</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {saleRecommendations.map((row) => (
                    <Panel key={row.id} noDivider padding>
                      <h3 className="text-lg font-semibold text-white">{row.name}</h3>
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
