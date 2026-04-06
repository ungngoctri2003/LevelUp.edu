import { motion } from 'framer-motion'
import { Reveal, RevealStagger, RevealItem } from '../motion/Reveal'
import { usePublicContent } from '../../hooks/usePublicContent'

function AvatarPlaceholder({ initial, color }) {
  const bgClass = color === 'purple' ? 'bg-fuchsia-500' : 'bg-cyan-500'
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${bgClass} text-2xl font-semibold text-white`}
    >
      {initial}
    </div>
  )
}

function TeacherPortrait({ teacher }) {
  if (teacher.imageSrc) {
    return (
      <img
        src={teacher.imageSrc}
        alt={`Chân dung ${teacher.name}`}
        className="h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    )
  }
  return <AvatarPlaceholder initial={teacher.initial} color={teacher.color} />
}

export default function Teachers() {
  const { teachers } = usePublicContent()
  return (
    <section id="teachers" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Đội ngũ giáo viên giàu kinh nghiệm
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-slate-400">
            Các thầy cô đến từ các trường uy tín với nhiều năm kinh nghiệm giảng dạy
          </p>
        </Reveal>
        <RevealStagger className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {teachers.map((teacher) => (
            <RevealItem key={teacher.id}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.25 }}
                className="group overflow-hidden rounded-2xl border border-transparent bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <motion.div
                    className="h-full w-full"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.4 }}
                  >
                    <TeacherPortrait teacher={teacher} />
                  </motion.div>
                </div>
                <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{teacher.name}</h3>
                <p className="mt-3 leading-relaxed text-gray-600 dark:text-slate-400">{teacher.bio}</p>
                </div>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
