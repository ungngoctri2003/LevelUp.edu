import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import { usePublicContent } from '../hooks/usePublicContent'
import { buildLessonsBySubject } from '../services/publicApi.js'

export default function LessonsPage() {
  const { subjects, lessons, loading, error } = usePublicContent()
  const lessonsBySubject = useMemo(() => buildLessonsBySubject(subjects, lessons), [subjects, lessons])
  const [selectedSubject, setSelectedSubject] = useState('')

  const firstId = lessonsBySubject[0]?.id || ''
  const activeId = selectedSubject || firstId
  const subject = lessonsBySubject.find((s) => s.id === activeId) || lessonsBySubject[0]

  useEffect(() => {
    if (error && !lessonsBySubject.length) toast.error(error)
  }, [error, lessonsBySubject.length])

  if (loading && !lessonsBySubject.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Đang tải bài giảng…
      </div>
    )
  }

  if (error && !lessonsBySubject.length) {
    return (
      <div className="py-24 text-center text-gray-600 dark:text-slate-400">
        Hiện không tải được danh sách bài giảng. Vui lòng thử tải lại trang.
      </div>
    )
  }

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Bài giảng</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Danh sách bài giảng theo từng môn học.
          </p>
        </Reveal>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {lessonsBySubject.map((s) => (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => setSelectedSubject(s.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-xl px-6 py-3 font-medium transition-shadow ${
                activeId === s.id
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
                  : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-cyan-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-500/50'
              }`}
            >
              <span className="mr-2">{s.icon}</span>
              {s.name}
            </motion.button>
          ))}
        </div>

        {subject && (
          <AnimatePresence mode="wait">
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800/90"
            >
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {subject.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      to={`/bai-giang/${lesson.id}`}
                      className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                          {lesson.duration} · {lesson.level}
                        </p>
                      </div>
                      <span className="text-cyan-600 dark:text-cyan-400">Chi tiết →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
