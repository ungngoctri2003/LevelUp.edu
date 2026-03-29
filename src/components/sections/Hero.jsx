import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Logo from '../Logo'
import { usePublicContent } from '../../hooks/usePublicContent'

const DEFAULT_HERO_STATS = [
  { value: '50K+', label: 'Học viên' },
  { value: '500+', label: 'Bài giảng' },
  { value: '98%', label: 'Hài lòng' },
]

const ease = [0.22, 1, 0.36, 1]

export default function Hero() {
  const { heroStats } = usePublicContent()
  const reduce = useReducedMotion()

  const { containerVariants, itemVariants } = useMemo(() => {
    if (reduce) {
      return {
        containerVariants: {
          hidden: { opacity: 1 },
          visible: { opacity: 1, transition: { staggerChildren: 0, delayChildren: 0 } },
        },
        itemVariants: {
          hidden: { opacity: 1, y: 0 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.01, ease } },
        },
      }
    }
    return {
      containerVariants: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.12 },
        },
      },
      itemVariants: {
        hidden: { opacity: 0, y: 22 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease },
        },
      },
    }
  }, [reduce])

  const items =
    heroStats && Array.isArray(heroStats.items) && heroStats.items.length > 0
      ? heroStats.items.filter((x) => x && (x.value != null || x.label != null))
      : DEFAULT_HERO_STATS
  const stats = items.map((x, i) => ({
    value: String(x.value ?? DEFAULT_HERO_STATS[i]?.value ?? '—'),
    label: String(x.label ?? DEFAULT_HERO_STATS[i]?.label ?? ''),
  }))

  const ctaMotion = reduce ? {} : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 } }

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
      <div className="hero-blob-fuchsia absolute -top-40 -right-40 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="hero-blob-cyan absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.9) 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, rgba(6,182,212,0.5) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }}
        />
        <div className="hero-float-dot-sm absolute top-1/4 left-[15%] h-3 w-3 rounded-full bg-amber-300/50" />
        <div className="hero-float-dot-md absolute top-1/3 right-[18%] h-2 w-2 rounded-full bg-cyan-300/70" />
        <div className="hero-float-diamond absolute bottom-1/3 left-1/4 h-4 w-4 rounded-lg bg-fuchsia-400/20" />
      </div>

      <motion.div
        className="relative z-10 mx-auto max-w-5xl px-4 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8 flex justify-center px-2">
          <Logo
            variant="hero"
            className="mx-auto max-w-[min(90vw,640px)] drop-shadow-[0_8px_40px_rgba(217,70,239,0.25)]"
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
          Học đa môn trực tuyến — Toán, khoa học, ngoại ngữ, văn và xã hội — video chất lượng, AI hỗ trợ 24/7 và lộ
          trình phù hợp từng học sinh
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mb-20 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-6"
        >
          <motion.div {...ctaMotion}>
            <Link
              to={{ pathname: '/', search: '?auth=register' }}
              className="inline-block w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-12 py-5 text-center text-lg font-bold text-slate-900 shadow-2xl shadow-amber-500/30 transition-shadow duration-300 hover:shadow-amber-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0f172a] sm:w-auto"
            >
              Bắt đầu miễn phí
            </Link>
          </motion.div>
          <motion.div {...ctaMotion}>
            <Link
              to="/bai-giang"
              className="inline-block w-full rounded-2xl border-2 border-cyan-400/60 bg-cyan-500/10 px-12 py-5 text-center text-lg font-bold text-cyan-100 backdrop-blur-sm transition-colors duration-300 hover:border-cyan-300 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0f172a] sm:w-auto"
            >
              Xem bài giảng
            </Link>
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-12 sm:gap-16">
          {stats.map((stat, i) => (
            <div
              key={`${stat.label}-${i}`}
              className="cursor-default text-center transition-transform duration-200 hover:-translate-y-1 hover:scale-105"
            >
              <div className="bg-gradient-to-br from-white to-cyan-100 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-fuchsia-200/90">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
