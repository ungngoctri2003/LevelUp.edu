import { motion } from 'framer-motion'
import { Reveal, RevealStagger, RevealItem } from '../motion/Reveal'
import { testimonials } from '../../data'

function AvatarPlaceholder({ initial, color }) {
  const bgClass = color === 'purple' ? 'bg-fuchsia-400' : 'bg-cyan-400'
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bgClass} text-sm font-semibold text-white`}
    >
      {initial}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-fuchsia-950 to-slate-950 py-24 sm:py-32"
    >
      <motion.div
        className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Học viên nói gì về chúng tôi
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-cyan-100/90">
            Cùng lắng nghe những chia sẻ từ học sinh đã theo học tại LevelUp.edu
          </p>
        </Reveal>
        <RevealStagger className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <RevealItem key={item.id}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.25 }}
                className="group relative h-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-colors duration-300 hover:border-cyan-400/30 hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5 }}>
                    <AvatarPlaceholder initial={item.initial} color={item.color} />
                  </motion.div>
                  <h3 className="font-semibold text-white">{item.name}</h3>
                </div>
                <p className="mt-5 leading-relaxed text-slate-200">&ldquo;{item.quote}&rdquo;</p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
