import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import PageLoading from '../components/ui/PageLoading.jsx'
import { useAuthSession } from '../context/AuthSessionContext'
import { usePublicContent } from '../hooks/usePublicContent'
import { buildLessonsByCourse } from '../services/publicApi.js'
import { getMyClasses, getMyCoursePayments, getMyPayments } from '../services/meApi.js'
import { userHasCourseAccess } from '../utils/courseAccess.js'

export default function CourseDetailPage() {
  const { courseId: courseIdParam } = useParams()
  const { profile, session } = useAuthSession()
  const { courses, subjects, lessons, saleClasses, loading, error } = usePublicContent()
  const [myClasses, setMyClasses] = useState([])
  const [myPayments, setMyPayments] = useState([])
  const [myCoursePayments, setMyCoursePayments] = useState([])
  /** Học viên đã tải xong ngữ cảnh thanh toán/ghi danh để tính hasAccess (tránh redirect sớm). */
  const [purchaseLoaded, setPurchaseLoaded] = useState(false)

  const courseNum = Number(courseIdParam)
  const lessonsByCourse = useMemo(
    () => buildLessonsByCourse(courses, lessons, subjects),
    [courses, lessons, subjects],
  )

  const activeCourse = useMemo(() => {
    if (!Number.isFinite(courseNum)) return null
    return lessonsByCourse.find((c) => Number(c.courseId) === courseNum) ?? null
  }, [lessonsByCourse, courseNum])

  const staffCanSeeCatalogLessons = profile?.role === 'admin' || profile?.role === 'teacher'
  const isStudent = profile?.role === 'student'

  const loadPurchaseContext = useCallback(async () => {
    const token = session?.access_token
    if (!token || !isStudent) {
      setMyClasses([])
      setMyPayments([])
      setMyCoursePayments([])
      setPurchaseLoaded(true)
      return
    }
    setPurchaseLoaded(false)
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
    } finally {
      setPurchaseLoaded(true)
    }
  }, [session?.access_token, isStudent])

  useEffect(() => {
    loadPurchaseContext()
  }, [loadPurchaseContext])

  const hasAccess = useMemo(
    () =>
      userHasCourseAccess(activeCourse, {
        profile,
        myClasses,
        myPayments,
        myCoursePayments,
        saleClasses,
      }),
    [activeCourse, profile, myClasses, myPayments, myCoursePayments, saleClasses],
  )

  const canViewPage = Boolean(staffCanSeeCatalogLessons || hasAccess)
  const waitingPurchaseContext = isStudent && !!session?.access_token && !purchaseLoaded

  if (loading && !lessonsByCourse.length) {
    return <PageLoading variant="page" />
  }

  if (error && !lessonsByCourse.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Hiện không tải được dữ liệu. Vui lòng thử tải lại trang.
      </div>
    )
  }

  if (!loading && !lessonsByCourse.length) {
    return <Navigate to="/bai-giang" replace />
  }

  if (!loading && (!Number.isFinite(courseNum) || !activeCourse)) {
    return <Navigate to="/bai-giang" replace />
  }

  if (!activeCourse) {
    return <PageLoading variant="page" />
  }

  if (waitingPurchaseContext) {
    return <PageLoading variant="page" />
  }

  if (!canViewPage) {
    return <Navigate to="/bai-giang" replace />
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <nav className="mb-8 text-sm text-gray-500 dark:text-slate-400">
          <Link to="/" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link to="/bai-giang" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Khóa học
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-slate-200">{activeCourse.courseTitle}</span>
        </nav>

        <Reveal>
          <header className="mb-10">
            <span className="inline-flex rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-300">
              {activeCourse.icon} {activeCourse.subjectName}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {activeCourse.courseTitle}
            </h1>
            {activeCourse.courseDescription ? (
              <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-slate-400">
                {activeCourse.courseDescription}
              </p>
            ) : null}
          </header>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40 dark:border-slate-600/80 dark:bg-slate-900/40 dark:shadow-black/20"
        >
          <div className="relative overflow-hidden border-b border-gray-100 bg-linear-to-br from-cyan-500/12 via-fuchsia-500/6 to-amber-400/10 px-6 py-7 sm:px-8 dark:border-slate-700/80">
            <div className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/10" aria-hidden />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/10" aria-hidden />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700/90 dark:text-cyan-300/90">
                  Lộ trình học
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Chương trình bài giảng
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  Các bài được sắp theo thứ tự — bấm vào từng bài để xem nội dung và video (nếu có).
                </p>
              </div>
              {activeCourse.lessons.length > 0 ? (
                <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur-sm dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100">
                  <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{activeCourse.lessons.length}</span>
                  <span className="text-gray-500 dark:text-slate-400">bài</span>
                </div>
              ) : null}
            </div>
          </div>

          {activeCourse.lessons.length === 0 ? (
            <div className="px-6 py-14 text-center sm:px-8">
              <div
                className="mx-auto h-14 w-14 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 dark:border-slate-600 dark:bg-slate-800/50"
                aria-hidden
              />
              <p className="mt-4 text-sm text-gray-600 dark:text-slate-400">
                Khóa này chưa có bài giảng nào trong danh mục.
              </p>
            </div>
          ) : (
            <ul className="space-y-3 p-4 sm:p-6">
              {activeCourse.lessons.map((lesson, index) => (
                <motion.li
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(index * 0.06, 0.45), ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/bai-giang/${lesson.id}`}
                    className="group flex w-full gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all duration-200 hover:border-cyan-400/45 hover:bg-white hover:shadow-lg hover:shadow-cyan-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 dark:border-slate-700/80 dark:bg-slate-800/30 dark:hover:border-cyan-500/40 dark:hover:bg-slate-800/90 dark:hover:shadow-cyan-500/5 sm:gap-5 sm:p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-fuchsia-600 text-sm font-bold text-white shadow-md shadow-fuchsia-500/25 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-base">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-snug text-gray-900 transition-colors group-hover:text-cyan-700 dark:text-white dark:group-hover:text-cyan-300">
                        {lesson.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200/80 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-600">
                          ⏱ {lesson.duration}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200/80 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-600">
                          {lesson.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center self-center">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-linear-to-r from-cyan-500 to-fuchsia-600 px-3 py-2 text-xs font-semibold text-white opacity-95 shadow-md shadow-fuchsia-500/20 transition group-hover:opacity-100 sm:px-4 sm:text-sm">
                        {staffCanSeeCatalogLessons ? 'Quản trị' : 'Học bài'}
                        <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        <div className="mt-10">
          <Link
            to="/bai-giang"
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Quay lại danh sách khóa học
          </Link>
        </div>
      </div>
    </div>
  )
}
