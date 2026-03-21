import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../Logo'

const stats = [
  { value: '50K+', label: 'Học viên' },
  { value: '500+', label: 'Bài giảng' },
  { value: '98%', label: 'Hài lòng' },
]

const ease = [0.22, 1, 0.36, 1]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease },
  },
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[600px] items-center justify-center overflow-hidden px-6 py-28 sm:min-h-[720px] sm:py-36"
      style={{
        background: `
          radial-gradient(ellipse 90% 60% at 50% -10%, rgba(217, 70, 239, 0.35), transparent 55%),
          radial-gradient(ellipse 70% 50% at 80% 60%, rgba(6, 182, 212, 0.2), transparent 50%),
          radial-gradient(ellipse 60% 40% at 10% 80%, rgba(232, 121, 249, 0.15), transparent 45%),
          linear-gradient(180deg, #0a0612 0%, #1a0a2e 40%, #0f172a 100%)
        `,
      }}
    >
      <motion.div
        className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.38, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.9) 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, rgba(6,182,212,0.5) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }}
        />
        <motion.div
          className="absolute top-1/4 left-[15%] h-3 w-3 rounded-full bg-amber-300/50"
          animate={{ y: [0, -12, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-[18%] h-2 w-2 rounded-full bg-cyan-300/70"
          animate={{ y: [0, 10, 0], x: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 h-4 w-4 rotate-45 rounded-lg bg-fuchsia-400/20"
          animate={{ rotate: [45, 50, 45], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10 mx-auto max-w-5xl px-4 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        <motion.div
          variants={itemVariants}
          className="mb-8 flex justify-center px-2"
        >
          <Logo
            variant="hero"
            className="mx-auto drop-shadow-[0_8px_40px_rgba(217,70,239,0.25)] max-w-[min(90vw,640px)]"
          />
        </motion.div>
        <motion.p
          variants={itemVariants}
          className="mb-4 bg-gradient-to-r from-amber-200 via-cyan-200 to-fuchsia-200 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl"
        >
          Nâng tầm điểm số của bạn
        </motion.p>
        <motion.p
          variants={itemVariants}
          className="mb-14 mx-auto max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl"
        >
          Học toán trực tuyến với video bài giảng chất lượng cao, AI hỗ trợ 24/7 và lộ trình cá nhân hóa theo trình độ
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mb-20 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-6"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Link
              to={{ pathname: '/', search: '?auth=register' }}
              className="inline-block w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-12 py-5 text-center text-lg font-bold text-slate-900 shadow-2xl shadow-amber-500/30 transition-shadow duration-300 hover:shadow-amber-400/50 sm:w-auto"
            >
              Học thử miễn phí
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/bai-giang"
              className="inline-block w-full rounded-2xl border-2 border-cyan-400/60 bg-cyan-500/10 px-12 py-5 text-center text-lg font-bold text-cyan-100 backdrop-blur-sm transition-colors duration-300 hover:border-cyan-300 hover:bg-cyan-500/20 sm:w-auto"
            >
              Xem bài giảng
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-12 sm:gap-16"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.12, duration: 0.5, ease }}
              whileHover={{ y: -6, scale: 1.05, transition: { duration: 0.25 } }}
              className="cursor-default text-center"
            >
              <div className="bg-gradient-to-br from-white to-cyan-100 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-fuchsia-200/90">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
