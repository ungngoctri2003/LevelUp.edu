import { motion } from 'framer-motion'
import { Reveal, RevealStagger, RevealItem } from '../motion/Reveal'
import { courses } from '../../data'

export default function Courses() {
  return (
    <section id="courses" className="py-24 dark:bg-slate-950 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Khóa học toán
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-slate-400">
            Lộ trình học phù hợp với mọi cấp độ từ cơ bản đến nâng cao
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
                <div className="relative h-1.5 overflow-hidden bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-400">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                    {course.title}
                  </h3>
                  <p className="mt-4 line-clamp-3 leading-relaxed text-gray-600 dark:text-slate-400">{course.description}</p>
                  <motion.a
                    href={`#course-${course.id}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-6 py-3 font-medium text-white shadow-md shadow-fuchsia-500/20 transition-opacity hover:opacity-95"
                  >
                    Xem chi tiết
                  </motion.a>
                </div>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
