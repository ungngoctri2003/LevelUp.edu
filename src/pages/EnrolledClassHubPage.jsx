import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Reveal } from '../components/motion/Reveal'
import ClassPaymentModal from '../components/ClassPaymentModal.jsx'
import { useAuthSession } from '../context/AuthSessionContext'
import { usePublicContent } from '../hooks/usePublicContent'
import { getMyClassLessonPosts, getMyClasses, getMyPayments } from '../services/meApi.js'
import StudentClassSchedule from './student/StudentClassSchedule.jsx'
import StudentWorkHub from './student/StudentWorkHub.jsx'

const TAB = {
  lessons: 'lessons',
  assignments: 'assignments',
  exams: 'exams',
  schedule: 'schedule',
}

const tabBtn =
  'rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5 sm:text-base'

function displaySaleTitle(row) {
  if (!row) return ''
  const code = typeof row.code === 'string' ? row.code.trim() : ''
  return code ? `${row.name} (${code})` : row.name
}

function paymentStateForClass(classId, myPayments) {
  const cid = Number(classId)
  const paymentsForClass = (myPayments || []).filter((p) => Number(p.class_id) === cid)
  const pending = paymentsForClass.find((p) => p.payment_status === 'pending')
  if (pending) return { kind: 'pending' }
  const paid = paymentsForClass.find((p) => p.payment_status === 'paid')
  if (paid) return { kind: 'paid' }
  return { kind: 'open' }
}

export default function EnrolledClassHubPage() {
  const { classId: classIdParam } = useParams()
  const { profile, session, user } = useAuthSession()
  const { saleClasses, loading: publicLoading } = usePublicContent()
  const token = session?.access_token
  const classIdNum = Number(classIdParam)
  const isStudent = profile?.role === 'student'

  const [myClasses, setMyClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(!!token && !!isStudent)
  const [myPayments, setMyPayments] = useState([])
  const [classPosts, setClassPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(TAB.lessons)
  const [payModalOpen, setPayModalOpen] = useState(false)

  const saleRow = useMemo(
    () => (saleClasses || []).find((s) => Number(s.id) === classIdNum) ?? null,
    [saleClasses, classIdNum],
  )

  const loadClasses = useCallback(async () => {
    if (!token || !isStudent) {
      setMyClasses([])
      setClassesLoading(false)
      return
    }
    setClassesLoading(true)
    try {
      const res = await getMyClasses(token)
      setMyClasses(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setMyClasses([])
    } finally {
      setClassesLoading(false)
    }
  }, [token, isStudent])

  const loadPayments = useCallback(async () => {
    if (!token || !isStudent) {
      setMyPayments([])
      return
    }
    try {
      const res = await getMyPayments(token)
      setMyPayments(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setMyPayments([])
    }
  }, [token, isStudent])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const enrollment = useMemo(() => {
    if (!Number.isFinite(classIdNum)) return null
    return myClasses.find((c) => Number(c.class_id) === classIdNum) ?? null
  }, [myClasses, classIdNum])

  const payState = useMemo(
    () => paymentStateForClass(classIdNum, myPayments),
    [classIdNum, myPayments],
  )

  const loadPosts = useCallback(async () => {
    if (!token || !isStudent || !enrollment) {
      setClassPosts([])
      return
    }
    setPostsLoading(true)
    try {
      const { data } = await getMyClassLessonPosts(token)
      const list = Array.isArray(data) ? data : []
      setClassPosts(list.filter((p) => Number(p.class_id) === classIdNum))
    } catch {
      setClassPosts([])
    } finally {
      setPostsLoading(false)
    }
  }, [token, isStudent, enrollment, classIdNum])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const sortedPosts = useMemo(() => {
    return [...classPosts].sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
  }, [classPosts])

  if (!Number.isFinite(classIdNum)) {
    return (
      <div className="py-24 text-center text-slate-600 dark:text-slate-400">
        <p>Mã lớp không hợp lệ.</p>
        <Link to="/lop-hoc" className="mt-4 inline-block font-semibold text-emerald-600 dark:text-emerald-400">
          ← Lớp học
        </Link>
      </div>
    )
  }

  if (publicLoading) {
    return <div className="py-24 text-center text-slate-500">Đang tải…</div>
  }

  if (token && isStudent && classesLoading) {
    return <div className="py-24 text-center text-slate-500">Đang tải…</div>
  }

  if (enrollment) {
    const title = enrollment.class_code
      ? `${enrollment.class_name} (${enrollment.class_code})`
      : enrollment.class_name

    return (
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mb-10">
            <nav className="mb-4 text-sm text-gray-500 dark:text-slate-400">
              <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Trang chủ
              </Link>
              <span className="mx-2">/</span>
              <Link to="/lop-hoc" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Lớp học
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-slate-200">{title}</span>
            </nav>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{title}</h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              {enrollment.subject} · {enrollment.grade_label}
              {enrollment.teacher_name ? ` · GV ${enrollment.teacher_name}` : ''}
            </p>
            {enrollment.schedule_summary ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Lịch: {enrollment.schedule_summary}</p>
            ) : null}
            <Link
              to="/hoc-vien/khoa-hoc"
              className="mt-4 inline-block text-sm font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400"
            >
              Mở khu học viên đầy đủ →
            </Link>
          </Reveal>

          <div className="mb-8 flex flex-wrap gap-2 border-b border-gray-200 pb-px dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab(TAB.lessons)}
              className={`${tabBtn} border-b-2 ${
                activeTab === TAB.lessons
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Bài giảng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TAB.assignments)}
              className={`${tabBtn} border-b-2 ${
                activeTab === TAB.assignments
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Bài tập
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TAB.exams)}
              className={`${tabBtn} border-b-2 ${
                activeTab === TAB.exams
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Kiểm tra
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TAB.schedule)}
              className={`${tabBtn} border-b-2 ${
                activeTab === TAB.schedule
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Lịch học
            </button>
          </div>

          {activeTab === TAB.lessons && (
            <section className="space-y-4" aria-labelledby="hub-lessons-heading">
              <h2 id="hub-lessons-heading" className="sr-only">
                Bài giảng trong lớp
              </h2>
              {postsLoading && <p className="text-center text-gray-600 dark:text-slate-400">Đang tải bài giảng…</p>}
              {!postsLoading && sortedPosts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-800/40">
                  <p className="text-gray-700 dark:text-slate-300">Chưa có bài giảng nào trong lớp này.</p>
                </div>
              )}
              {!postsLoading && sortedPosts.length > 0 && (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/90">
                  {sortedPosts.map((post) => (
                    <li key={post.id}>
                      <Link
                        to={`/bai-giang/lop/${post.id}`}
                        className="flex flex-wrap items-start justify-between gap-3 px-6 py-5 transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {post.duration_display}
                            {post.subject ? ` · ${post.subject}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          Xem nội dung →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

        {(activeTab === TAB.assignments || activeTab === TAB.exams) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:p-6">
            {user?.dbRole === 'student' ? (
              <StudentWorkHub
                publicSurface
                embedded
                embeddedFocus={activeTab === TAB.exams ? 'exams' : 'assignments'}
                filterClassId={classIdNum}
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">Tải vai trò học viên…</p>
            )}
          </div>
        )}

        {activeTab === TAB.schedule && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:p-6">
            {user?.dbRole === 'student' ? (
              <StudentClassSchedule embedded lockedClassId={String(classIdNum)} publicSurface />
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">Tải vai trò học viên…</p>
            )}
          </div>
        )}
        </div>
      </div>
    )
  }

  if (!saleRow) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-600 dark:text-slate-400">Không tìm thấy lớp trong danh mục mở đăng ký.</p>
        <Link to="/lop-hoc" className="mt-4 inline-block font-semibold text-emerald-600 dark:text-emerald-400">
          ← Danh sách lớp học
        </Link>
      </div>
    )
  }

  const previewTitle = displaySaleTitle(saleRow)
  const fee =
    saleRow.tuition_fee != null && Number.isFinite(Number(saleRow.tuition_fee))
      ? `${Number(saleRow.tuition_fee).toLocaleString('vi-VN')}đ`
      : 'Liên hệ'

  return (
    <div className="py-16 sm:py-24">
      <ClassPaymentModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        classId={saleRow.id}
        classTitle={previewTitle}
        tuitionFee={saleRow.tuition_fee ?? null}
        onSubmitted={() => {
          loadClasses()
          loadPayments()
        }}
      />
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <nav className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link to="/lop-hoc" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              Lớp học
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-slate-200">{previewTitle}</span>
          </nav>
          <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-white shadow-xl dark:border-emerald-900/40 dark:bg-slate-900/80">
            <div className="h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{saleRow.name}</h1>
              {saleRow.code ? (
                <p className="mt-1 font-mono text-sm text-gray-500 dark:text-slate-500">Mã: {saleRow.code}</p>
              ) : null}
              <p className="mt-3 text-gray-600 dark:text-slate-400">
                <span className="font-medium text-gray-800 dark:text-slate-200">Môn:</span> {saleRow.subject} ·{' '}
                <span className="font-medium text-gray-800 dark:text-slate-200">Khối:</span> {saleRow.grade_label}
              </p>
              {saleRow.schedule_summary ? (
                <p className="mt-2 text-gray-600 dark:text-slate-400">
                  <span className="font-medium text-gray-800 dark:text-slate-200">Lịch:</span> {saleRow.schedule_summary}
                </p>
              ) : null}
              <p className="mt-2 text-gray-600 dark:text-slate-400">
                <span className="font-medium text-gray-800 dark:text-slate-200">Giáo viên:</span> {saleRow.teacher_name}
              </p>
              <p className="mt-4 text-lg font-semibold text-emerald-700 dark:text-emerald-300">Học phí: {fee}</p>
              {saleRow.sales_note ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {saleRow.sales_note}
                </p>
              ) : null}

              <div className="mt-8 border-t border-gray-200 pt-6 dark:border-slate-700">
                {!token && (
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    <Link to="/?auth=login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                      Đăng nhập
                    </Link>{' '}
                    tài khoản học viên để gửi yêu cầu đăng ký / thanh toán và xem nội dung lớp sau khi được ghi danh.
                  </p>
                )}
                {token && !isStudent && (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Chỉ tài khoản học viên mới đăng ký được lớp này.
                  </p>
                )}
                {token && isStudent && payState.kind === 'open' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setPayModalOpen(true)}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500"
                    >
                      Đăng ký / thanh toán
                    </button>
                    <p className="self-center text-sm text-gray-500 dark:text-slate-500">
                      Sau khi trung tâm xác nhận và ghi danh, bạn sẽ xem được bài giảng và lịch tại đây.
                    </p>
                  </div>
                )}
                {token && isStudent && payState.kind === 'pending' && (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Bạn đã gửi yêu cầu thanh toán — vui lòng chờ trung tâm xác nhận.
                  </p>
                )}
                {token && isStudent && payState.kind === 'paid' && (
                  <p className="text-sm text-sky-800 dark:text-sky-200">
                    Đã ghi nhận thanh toán — trung tâm sẽ hoàn tất ghi danh. Sau đó bạn tải lại trang này để vào lớp.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
