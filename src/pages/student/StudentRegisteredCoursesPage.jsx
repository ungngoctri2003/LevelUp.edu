import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import CoursePaymentModal from '../../components/CoursePaymentModal.jsx'
import PageHeader from '../../components/dashboard/PageHeader'
import { useAuthSession } from '../../context/AuthSessionContext'
import { usePublicContent } from '../../hooks/usePublicContent'
import { PUBLIC_LOAD_ERROR } from '../../lib/publicUserMessages.js'
import { buildLessonsByCourse } from '../../services/publicApi.js'
import { getMyClasses, getMyCoursePayments, getMyPayments } from '../../services/meApi.js'
import { normSubject, userHasCourseAccess } from '../../utils/courseAccess.js'

/**
 * Trạng thái hiển thị — luôn dựa trên bản ghi thanh toán khóa mới nhất (`cpRow`),
 * không dùng .find() trên cả danh sách (tránh bản pending cũ che trạng thái cancelled mới).
 */
function getRegisteredCourseStatus(co, cpRow, { profile, myClasses, myPayments, saleClasses }) {
  if (profile?.role === 'admin' || profile?.role === 'teacher') {
    return { tone: 'violet', label: 'Toàn quyền xem' }
  }

  if (cpRow?.payment_status === 'paid') {
    return { tone: 'emerald', label: 'Đã thanh toán khóa' }
  }

  const key = normSubject(co.subjectName)
  if (myClasses?.some((r) => normSubject(r.subject) === key)) {
    return { tone: 'sky', label: 'Mở qua lớp đã ghi danh' }
  }

  const sale = saleClasses?.find((s) => normSubject(s.subject) === key)
  if (
    sale &&
    myPayments?.some((p) => Number(p.class_id) === Number(sale.id) && p.payment_status === 'paid')
  ) {
    return { tone: 'cyan', label: 'Mở qua thanh toán lớp' }
  }

  if (cpRow?.payment_status === 'cancelled') {
    return { tone: 'rose', label: 'Yêu cầu đã hủy' }
  }
  if (cpRow?.payment_status === 'pending') {
    return { tone: 'amber', label: 'Chờ xác nhận thanh toán' }
  }

  return { tone: 'slate', label: 'Chưa thanh toán' }
}

const statusToneClass = {
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  sky: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
  slate: 'border-white/15 bg-white/5 text-slate-300',
  violet: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
}

export default function StudentRegisteredCoursesPage() {
  const { profile, session } = useAuthSession()
  const { courses, subjects, lessons, saleClasses, loading, error } = usePublicContent()
  const [myClasses, setMyClasses] = useState([])
  const [myPayments, setMyPayments] = useState([])
  const [myCoursePayments, setMyCoursePayments] = useState([])
  /** Đang gọi API lớp / thanh toán / course-payments của học viên */
  const [meLoading, setMeLoading] = useState(true)
  const [payModalCourse, setPayModalCourse] = useState(null)

  const lessonsByCourse = useMemo(
    () => buildLessonsByCourse(courses, lessons, subjects),
    [courses, lessons, subjects],
  )

  const isStudent = profile?.role === 'student'
  const isStaff = profile?.role === 'admin' || profile?.role === 'teacher'
  /** Catalog công khai + dữ liệu /api/me của học viên */
  const dataLoading = Boolean(isStudent && (loading || meLoading))

  const loadPurchaseContext = useCallback(async () => {
    const token = session?.access_token
    if (!token || profile?.role !== 'student') {
      setMyClasses([])
      setMyPayments([])
      setMyCoursePayments([])
      setMeLoading(false)
      return
    }
    setMeLoading(true)
    try {
      const [cRes, pRes, cpRes] = await Promise.all([
        getMyClasses(token),
        getMyPayments(token),
        getMyCoursePayments(token),
      ])
      setMyClasses(Array.isArray(cRes?.data) ? cRes.data : [])
      setMyPayments(Array.isArray(pRes?.data) ? pRes.data : [])
      setMyCoursePayments(Array.isArray(cpRes?.data) ? cpRes.data : [])
    } catch (e) {
      if (import.meta.env.DEV) console.error('[StudentRegisteredCoursesPage]', e)
      toast.error(PUBLIC_LOAD_ERROR)
      setMyClasses([])
      setMyPayments([])
      setMyCoursePayments([])
    } finally {
      setMeLoading(false)
    }
  }, [session?.access_token, profile?.role])

  useEffect(() => {
    loadPurchaseContext()
  }, [loadPurchaseContext])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && profile?.role === 'student' && session?.access_token) {
        void loadPurchaseContext()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadPurchaseContext, profile?.role, session?.access_token])

  useEffect(() => {
    if (error && !lessonsByCourse.length) toast.error(error)
  }, [error, lessonsByCourse.length])

  const purchaseCtx = useMemo(
    () => ({ profile, myClasses, myPayments, myCoursePayments, saleClasses }),
    [profile, myClasses, myPayments, myCoursePayments, saleClasses],
  )

  const tableRows = useMemo(() => {
    if (!isStudent) return []
    const payments = myCoursePayments || []
    const latestPaymentByCourse = new Map()
    for (const p of payments) {
      const cid = Number(p.course_id)
      if (!Number.isFinite(cid)) continue
      const prev = latestPaymentByCourse.get(cid)
      if (!prev || String(p.submitted_at || '') > String(prev.submitted_at || '')) {
        latestPaymentByCourse.set(cid, p)
      }
    }

    const metaById = new Map(lessonsByCourse.map((co) => [Number(co.courseId), co]))

    const rows = []
    for (const [cid, cpRow] of latestPaymentByCourse) {
      const co = metaById.get(cid)
      if (co) {
        rows.push({
          co,
          cpRow,
          lessonCount: co.lessons?.length ?? 0,
          status: getRegisteredCourseStatus(co, cpRow, purchaseCtx),
          unlocked: userHasCourseAccess(co, purchaseCtx),
          amount:
            cpRow?.amount != null && Number.isFinite(Number(cpRow.amount))
              ? Number(cpRow.amount)
              : co.listPrice != null && Number.isFinite(Number(co.listPrice))
                ? Number(co.listPrice)
                : null,
        })
      } else {
        const synthetic = {
          id: String(cid),
          courseId: cid,
          courseTitle: cpRow?.course_title || `Khóa #${cid}`,
          subjectName: '—',
          icon: '📘',
          lessons: [],
        }
        rows.push({
          co: synthetic,
          cpRow,
          lessonCount: 0,
          status: getRegisteredCourseStatus(synthetic, cpRow, purchaseCtx),
          unlocked: userHasCourseAccess(synthetic, purchaseCtx),
          amount:
            cpRow?.amount != null && Number.isFinite(Number(cpRow.amount)) ? Number(cpRow.amount) : null,
        })
      }
    }

    rows.sort((a, b) => String(a.co.courseTitle).localeCompare(String(b.co.courseTitle), 'vi'))
    return rows
  }, [isStudent, lessonsByCourse, purchaseCtx, myCoursePayments])

  return (
    <div className="space-y-8">
      <CoursePaymentModal
        open={!!payModalCourse}
        onClose={() => setPayModalCourse(null)}
        courseId={payModalCourse?.courseId}
        courseTitle={payModalCourse?.courseTitle ?? ''}
        listPrice={payModalCourse?.listPrice ?? null}
        onSubmitted={loadPurchaseContext}
      />
      <PageHeader
        eyebrow="Học viên"
        title="Khóa học đã đăng ký"
        description="Các khóa học online bạn đã gửi yêu cầu thanh toán (catalog). Trạng thái thanh toán lớp học tại mục Thanh toán lớp trong Lớp học của tôi."
      />

      <p className="text-sm text-slate-400">
        <Link to="/bai-giang" className="font-semibold text-sky-300 hover:text-sky-200">
          Mở danh mục khóa học công khai →
        </Link>
        {' · '}
        <Link
          to="/hoc-vien/khoa-hoc#student-section-thanh-toan"
          className="font-semibold text-emerald-300 hover:text-emerald-200"
        >
          Thanh toán &amp; trạng thái lớp →
        </Link>
      </p>

      {!isStudent && (
        <p className="text-sm text-slate-400">Chỉ tài khoản học viên xem được bảng thanh toán khóa học.</p>
      )}

      {dataLoading && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-6 sm:px-6">
          <span
            className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400"
            aria-hidden
          />
          <p className="text-sm text-slate-300">Đang tải dữ liệu khóa học và thanh toán…</p>
        </div>
      )}

      {isStudent &&
        !dataLoading &&
        lessonsByCourse.length === 0 &&
        (myCoursePayments || []).length === 0 && (
          <p className="text-sm text-slate-400">Hiện chưa có khóa học nào trong danh mục.</p>
        )}

      {isStudent &&
        !dataLoading &&
        lessonsByCourse.length > 0 &&
        (myCoursePayments || []).length === 0 && (
          <p className="text-sm text-slate-400">
            Bạn chưa đăng ký khóa học online nào (chưa gửi yêu cầu thanh toán khóa).{' '}
            <Link to="/bai-giang" className="font-semibold text-sky-300 hover:text-sky-200">
              Mở danh mục để đăng ký →
            </Link>
          </p>
        )}

      {isStudent && !dataLoading && tableRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">Khóa học — thống kê &amp; thanh toán</h2>
            <p className="mt-1 text-xs text-slate-500">
              Chỉ khóa đã có yêu cầu thanh toán của bạn. Trạng thái gồm thanh toán khóa hoặc quyền xem thêm qua lớp / thanh
              toán lớp cùng môn.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Khóa học</th>
                  <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Môn</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-300 sm:px-5">Bài giảng</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-300 sm:px-5">Giá / ghi nhận</th>
                  <th className="px-4 py-3 font-semibold text-slate-300 sm:px-5">Trạng thái</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-300 sm:px-5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tableRows.map(({ co, cpRow, lessonCount, status, unlocked, amount }) => (
                  <tr key={co.id} className="transition-colors hover:bg-white/[0.04]">
                    <td className="max-w-[220px] px-4 py-3 font-medium text-white sm:px-5">
                      <span className="line-clamp-2">{co.courseTitle}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 sm:px-5">
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>{co.icon}</span>
                        {co.subjectName}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200 sm:px-5">{lessonCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300 sm:px-5">
                      {amount != null ? `${amount.toLocaleString('vi-VN')}đ` : '—'}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusToneClass[status.tone]}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                      {unlocked || isStaff ? (
                        <Link
                          to={`/bai-giang/khoa/${co.courseId}`}
                          className="font-semibold text-sky-300 hover:text-sky-200"
                        >
                          Vào khóa
                        </Link>
                      ) : cpRow?.payment_status === 'pending' ? (
                        <span className="text-xs text-slate-500">Chờ xác nhận</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPayModalCourse(co)}
                          className="font-semibold text-amber-200 hover:text-amber-100"
                        >
                          Thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
