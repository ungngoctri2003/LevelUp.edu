import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { lessonsBySubject } from '../data'
import { Reveal } from '../components/motion/Reveal'

export default function LessonsPage() {
  const [selectedSubject, setSelectedSubject] = useState(lessonsBySubject[0]?.id || '')

  const subject = lessonsBySubject.find((s) => s.id === selectedSubject) || lessonsBySubject[0]

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Bài giảng
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Danh sách bài giảng theo từng môn học. Chọn môn để xem bài giảng.
          </p>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {lessonsBySubject.map((s) => (
            <motion.button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-xl px-6 py-3 font-medium transition-shadow ${
                selectedSubject === s.id
                  ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
                  : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-cyan-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-500/50'
              }`}
            >
              <span className="mr-2">{s.icon}</span>
              {s.name}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSubject}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-transparent bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800/90"
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-cyan-50/50 px-6 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900/80">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {subject?.icon} {subject?.name}
              </h2>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {subject?.lessons.map((lesson, i) => (
                <motion.li
                  key={lesson.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-cyan-50/50 dark:hover:bg-slate-700/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{lesson.level}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-slate-400">{lesson.duration}</span>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to={`/bai-giang/${lesson.id}`}
                        className="inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-fuchsia-500/20 transition-opacity hover:opacity-95"
                      >
                        Xem bài giảng
                      </Link>
                    </motion.div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
