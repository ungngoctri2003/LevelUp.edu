import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import { useAuthSession } from '../context/AuthSessionContext'
import { usePublicContent } from '../hooks/usePublicContent'
import { buildLessonsByCourse } from '../services/publicApi.js'
import { getMyClassLessonPosts } from '../services/meApi.js'

export default function LessonsPage() {
  const { profile, session } = useAuthSession()
  const { courses, subjects, lessons, loading, error } = usePublicContent()
  const [searchParams] = useSearchParams()
  const courseParamFromUrl = searchParams.get('course') || ''
  const subjectSlugFromUrl = searchParams.get('subject') || ''
  const lessonsByCourse = useMemo(
    () => buildLessonsByCourse(courses, lessons, subjects),
    [courses, lessons, subjects],
  )
  const [selectedCourse, setSelectedCourse] = useState('')
  const [sourceTab, setSourceTab] = useState(/** @type {'online' | 'class'} */ ('online'))
  const [classPosts, setClassPosts] = useState([])
  const [classPostsLoading, setClassPostsLoading] = useState(false)
  const [classPostsError, setClassPostsError] = useState(null)

  const isStudent = profile?.role === 'student'

  const firstCourseId = lessonsByCourse[0]?.id || ''
  const activeCourseId = selectedCourse || firstCourseId
  const activeCourse = lessonsByCourse.find((c) => c.id === activeCourseId) || lessonsByCourse[0]

  const loadClassPosts = useCallback(async () => {
    const token = session?.access_token
    if (!token || !isStudent) {
      setClassPosts([])
      setClassPostsError(null)
      return
    }
    setClassPostsLoading(true)
    setClassPostsError(null)
    try {
      const { data } = await getMyClassLessonPosts(token)
      setClassPosts(Array.isArray(data) ? data : [])
    } catch (e) {
      setClassPosts([])
      setClassPostsError(e?.message || 'Không tải được bài giảng lớp.')
    } finally {
      setClassPostsLoading(false)
    }
  }, [session?.access_token, isStudent])

  useEffect(() => {
    loadClassPosts()
  }, [loadClassPosts])

  useEffect(() => {
    if (!isStudent && sourceTab === 'class') setSourceTab('online')
  }, [isStudent, sourceTab])

  const classPostsByClass = useMemo(() => {
    const m = new Map()
    for (const p of classPosts) {
      const key = String(p.class_id)
      if (!m.has(key)) {
        m.set(key, {
          classId: p.class_id,
          className: p.class_name,
          classCode: p.class_code,
          items: [],
        })
      }
      m.get(key).items.push(p)
    }
    return [...m.values()]
  }, [classPosts])

  useEffect(() => {
    if (error && !lessonsByCourse.length) toast.error(error)
  }, [error, lessonsByCourse.length])

  /** ?course=<id> hoặc ?subject=<slug môn> (tương thích cũ — chọn khóa học cùng môn) */
  useEffect(() => {
    if (!lessonsByCourse.length) return
    if (courseParamFromUrl) {
      const n = Number(courseParamFromUrl)
      if (Number.isFinite(n) && lessonsByCourse.some((c) => Number(c.courseId) === n)) {
        setSelectedCourse(String(n))
        return
      }
    }
    if (subjectSlugFromUrl) {
      const hit = lessonsByCourse.find((c) => c.subjectSlug === subjectSlugFromUrl)
      if (hit) setSelectedCourse(String(hit.courseId))
    }
  }, [courseParamFromUrl, subjectSlugFromUrl, lessonsByCourse])

  if (loading && !lessonsByCourse.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Đang tải bài giảng…
      </div>
    )
  }

  if (error && !lessonsByCourse.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Hiện không tải được danh sách bài giảng. Vui lòng thử tải lại trang.
      </div>
    )
  }

  const tabBtn =
    'rounded-xl px-5 py-2.5 text-sm font-semibold transition-shadow sm:px-6 sm:py-3 sm:text-base'

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Bài giảng</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            {isStudent
              ? sourceTab === 'online'
                ? 'Chọn khóa học để xem các bài giảng trực tuyến bên trong — mở cho mọi người, có video và nội dung chi tiết.'
                : 'Các buổi / chủ đề giáo viên đăng trong lớp bạn đã ghi danh (khác với khóa học trực tuyến).'
              : 'Mỗi khóa học bao gồm nhiều bài giảng — chọn khóa để xem danh sách bài.'}
          </p>
        </Reveal>

        {isStudent && (
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <motion.button
              type="button"
              onClick={() => setSourceTab('online')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`${tabBtn} ${
                sourceTab === 'online'
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
                  : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-cyan-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              Trực tuyến
              <span className="ml-2 hidden text-xs font-normal opacity-90 sm:inline">(thư viện)</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setSourceTab('class')}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`${tabBtn} ${
                sourceTab === 'class'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-emerald-400/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              Lớp của tôi
              <span className="ml-2 hidden text-xs font-normal opacity-90 sm:inline">(đã ghi danh)</span>
            </motion.button>
          </div>
        )}

        {sourceTab === 'online' && (
          <>
            {lessonsByCourse.length === 0 ? (
              <p className="py-8 text-center text-gray-600 dark:text-slate-400">
                Hiện chưa có khóa học công khai hoặc dữ liệu đang cập nhật.
              </p>
            ) : (
              <>
                <div className="mb-4 text-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Khóa học</p>
                </div>
                <div className="mb-8 flex flex-wrap justify-center gap-3">
                  {lessonsByCourse.map((co) => (
                    <motion.button
                      key={co.id}
                      type="button"
                      onClick={() => setSelectedCourse(String(co.courseId))}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`max-w-full rounded-xl px-5 py-3 text-left font-medium transition-shadow sm:max-w-md ${
                        activeCourseId === co.id
                          ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
                          : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-cyan-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-500/50'
                      }`}
                    >
                      <span className="mr-2">{co.icon}</span>
                      <span className="align-middle">{co.courseTitle}</span>
                      <span
                        className={`mt-1 block text-xs font-normal ${
                          activeCourseId === co.id ? 'text-white/85' : 'text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        {co.subjectName}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {activeCourse && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCourse.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800/90"
                >
                  <div className="border-b border-gray-100 bg-gray-50/90 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Bài giảng trong khóa
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {activeCourse.courseTitle}
                    </h2>
                    {activeCourse.courseDescription ? (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-400">
                        {activeCourse.courseDescription}
                      </p>
                    ) : null}
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                    {activeCourse.lessons.length === 0 ? (
                      <li className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                        Khóa này chưa có bài giảng trực tuyến nào.
                      </li>
                    ) : (
                      activeCourse.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/bai-giang/${lesson.id}`}
                          className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                              {isStudent && (
                                <span className="shrink-0 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200">
                                  Trực tuyến
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                              {lesson.duration} · {lesson.level}
                            </p>
                          </div>
                          <span className="shrink-0 text-cyan-600 dark:text-cyan-400">Chi tiết →</span>
                        </Link>
                      </li>
                      ))
                    )}
                  </ul>
                </motion.div>
              </AnimatePresence>
                )}
              </>
            )}
          </>
        )}

        {sourceTab === 'class' && isStudent && (
          <AnimatePresence mode="wait">
            <motion.div
              key="class-posts"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              {classPostsLoading && (
                <p className="text-center text-gray-600 dark:text-slate-400">Đang tải bài giảng lớp…</p>
              )}
              {classPostsError && !classPostsLoading && (
                <p className="text-center text-red-600 dark:text-red-400">{classPostsError}</p>
              )}
              {!classPostsLoading && !classPostsError && classPosts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-800/40">
                  <p className="text-gray-700 dark:text-slate-300">
                    Chưa có bài giảng nào trong lớp bạn đã ghi danh, hoặc giáo viên chưa đăng.
                  </p>
                  <Link
                    to="/hoc-vien/khoa-hoc"
                    className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                  >
                    Mở trang học tập học viên →
                  </Link>
                </div>
              )}
              {!classPostsLoading &&
                classPostsByClass.map((block) => (
                  <div
                    key={String(block.classId)}
                    className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800/90"
                  >
                    <div className="border-b border-gray-100 bg-emerald-50/90 px-6 py-4 dark:border-slate-700 dark:bg-emerald-950/30">
                      <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        {block.className}
                        {block.classCode ? (
                          <span className="ml-2 font-normal text-emerald-800/80 dark:text-emerald-200/80">
                            ({block.classCode})
                          </span>
                        ) : null}
                      </h2>
                      <p className="mt-1 text-xs text-emerald-800/70 dark:text-emerald-300/70">
                        Bài giảng do giáo viên đăng cho lớp này — không dùng chung URL với thư viện trực tuyến.
                      </p>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                      {block.items.map((post) => (
                        <li key={post.id} className="px-6 py-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                                <span className="shrink-0 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                                  Lớp học
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                                {post.duration_display}
                                {post.subject ? ` · ${post.subject}` : ''}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
