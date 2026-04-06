import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Reveal, RevealStagger, RevealItem } from '../motion/Reveal'
import { usePublicContent } from '../../hooks/usePublicContent'

export default function Courses() {
  const { courses } = usePublicContent()
  return (
    <section id="courses" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal variant="fadeUpScale" className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Khóa học đa môn
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-slate-400">
            Toán, Lý, Hóa, Anh, Văn, Sinh… — chọn môn bạn cần, học theo lộ trình rõ ràng
          </p>
        </Reveal>
        <RevealStagger className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <RevealItem key={course.id}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="group relative h-full overflow-hidden rounded-2xl border border-transparent bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div className="relative h-1.5 overflow-hidden bg-linear-to-r from-cyan-500 via-fuchsia-500 to-amber-400">
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                  />
                </div>
                <div className="p-8">
                  {course.subject && (
                    <span className="mb-2 inline-block rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                      {course.subject}
                    </span>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                    {course.title}
                  </h3>
                  <p className="mt-4 line-clamp-3 leading-relaxed text-gray-600 dark:text-slate-400">{course.description}</p>
                  <Link
                    to={`/bai-giang?course=${course.id}`}
                    className="mt-6 inline-block rounded-xl bg-linear-to-r from-cyan-500 to-fuchsia-600 px-6 py-3 font-medium text-white shadow-md shadow-fuchsia-500/20 transition-opacity hover:opacity-95"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
