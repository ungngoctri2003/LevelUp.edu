import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import CoursePaymentModal from '../components/CoursePaymentModal.jsx'
import { useAuthSession } from '../context/AuthSessionContext'
import { usePublicContent } from '../hooks/usePublicContent'
import { buildLessonsByCourse } from '../services/publicApi.js'
import { getMyClasses, getMyCoursePayments, getMyPayments } from '../services/meApi.js'
import { userHasCourseAccess } from '../utils/courseAccess.js'

export default function LessonsPage() {
  const { profile, session } = useAuthSession()
  const { courses, subjects, lessons, saleClasses, loading, error } = usePublicContent()
  const [searchParams] = useSearchParams()
  const courseParamFromUrl = searchParams.get('course') || ''
  const subjectSlugFromUrl = searchParams.get('subject') || ''
  const lessonsByCourse = useMemo(
    () => buildLessonsByCourse(courses, lessons, subjects),
    [courses, lessons, subjects],
  )
  const [myClasses, setMyClasses] = useState([])
  const [myPayments, setMyPayments] = useState([])
  const [myCoursePayments, setMyCoursePayments] = useState([])
  const [payModalCourse, setPayModalCourse] = useState(null)

  const isStudent = profile?.role === 'student'
  const isStaff = profile?.role === 'admin' || profile?.role === 'teacher'

  const loadPurchaseContext = useCallback(async () => {
    const token = session?.access_token
    if (!token || profile?.role !== 'student') {
      setMyClasses([])
      setMyPayments([])
      setMyCoursePayments([])
      return
    }
    try {
      const [cRes, pRes, cpRes] = await Promise.all([
        getMyClasses(token),
        getMyPayments(token),
        getMyCoursePayments(token),
      ])
      setMyClasses(Array.isArray(cRes?.data) ? cRes.data : [])
      setMyPayments(Array.isArray(pRes?.data) ? pRes.data : [])
      setMyCoursePayments(Array.isArray(cpRes?.data) ? cpRes.data : [])
    } catch {
      setMyClasses([])
      setMyPayments([])
      setMyCoursePayments([])
    }
  }, [session?.access_token, profile?.role])

  useEffect(() => {
    loadPurchaseContext()
  }, [loadPurchaseContext])

  useEffect(() => {
    if (error && !lessonsByCourse.length) toast.error(error)
  }, [error, lessonsByCourse.length])

  const legacyCourseDetailPath = useMemo(() => {
    if (!lessonsByCourse.length) return null
    if (courseParamFromUrl) {
      const n = Number(courseParamFromUrl)
      if (Number.isFinite(n) && lessonsByCourse.some((c) => Number(c.courseId) === n)) {
        return `/bai-giang/khoa/${n}`
      }
    }
    if (subjectSlugFromUrl) {
      const hit = lessonsByCourse.find((c) => c.subjectSlug === subjectSlugFromUrl)
      if (hit) return `/bai-giang/khoa/${hit.courseId}`
    }
    return null
  }, [lessonsByCourse, courseParamFromUrl, subjectSlugFromUrl])

  if (loading && !lessonsByCourse.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Đang tải khóa học…
      </div>
    )
  }

  if (error && !lessonsByCourse.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Hiện không tải được danh sách khóa học. Vui lòng thử tải lại trang.
      </div>
    )
  }

  if (legacyCourseDetailPath) {
    return <Navigate to={legacyCourseDetailPath} replace />
  }

  return (
    <div className="py-16 sm:py-24">
      <CoursePaymentModal
        open={!!payModalCourse}
        onClose={() => setPayModalCourse(null)}
        courseId={payModalCourse?.courseId}
        courseTitle={payModalCourse?.courseTitle ?? ''}
        listPrice={payModalCourse?.listPrice ?? null}
        onSubmitted={loadPurchaseContext}
      />
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Khóa học</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            {isStudent
              ? 'Chọn khóa để xem chi tiết. Bạn cần thanh toán và được xác nhận (hoặc đã ghi danh lớp cùng môn) để mở đầy đủ nội dung khóa. Lớp đã ghi danh xem tại trang Lớp học.'
              : 'Chọn khóa học — sau khi thanh toán được xác nhận bạn sẽ xem được toàn bộ chương trình. Bấm vào khóa chưa mở để xem hướng dẫn thanh toán.'}
          </p>
        </Reveal>

        {lessonsByCourse.length === 0 ? (
          <p className="py-8 text-center text-gray-600 dark:text-slate-400">
            Hiện chưa có khóa học công khai hoặc dữ liệu đang cập nhật.
          </p>
        ) : (
          <>
            <p className="mb-8 text-center text-sm text-gray-600 dark:text-slate-400">
              Khóa chưa thanh toán sẽ khóa — bấm vào thẻ để thanh toán; khóa đã mở có thể vào xem chi tiết.
            </p>

            <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lessonsByCourse.map((co) => {
                const unlocked = userHasCourseAccess(co, {
                  profile,
                  myClasses,
                  myPayments,
                  myCoursePayments,
                  saleClasses,
                })
                const canNavigate = isStaff || unlocked
                const cardInner = (
                  <>
                    <div className="relative h-1.5 overflow-hidden bg-linear-to-r from-cyan-500 via-fuchsia-500 to-amber-400">
                      <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                      />
                    </div>
                    <div className="p-6 sm:p-7">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                          {co.icon} {co.subjectName}
                        </span>
                        {!canNavigate ? (
                          <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                            Chưa mở khóa
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{co.courseTitle}</h2>
                      {co.courseDescription ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                          {co.courseDescription}
                        </p>
                      ) : null}
                      <p className="mt-4 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                        {canNavigate ? 'Xem chi tiết khóa học →' : 'Bấm để thanh toán và mở khóa →'}
                      </p>
                    </div>
                  </>
                )
                return (
                  <motion.div key={co.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }} className="h-full">
                    {canNavigate ? (
                      <Link
                        to={`/bai-giang/khoa/${co.courseId}`}
                        className="group relative block h-full overflow-hidden rounded-2xl border border-transparent bg-white text-left shadow-lg transition-shadow hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800/80"
                      >
                        {cardInner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPayModalCourse(co)}
                        className="group relative block h-full w-full overflow-hidden rounded-2xl border border-amber-200/60 bg-white text-left shadow-lg transition-shadow hover:shadow-xl dark:border-amber-500/20 dark:bg-slate-800/80"
                      >
                        {cardInner}
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
