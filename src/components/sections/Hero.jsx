import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Logo from '../Logo'
import { landingHeroStats } from '../../data'

const ease = [0.22, 1, 0.36, 1]

export default function Hero() {
  const reduce = useReducedMotion()

  const { containerVariants, itemVariants, statsRowVariants, statItemVariants } = useMemo(() => {
    if (reduce) {
      const instant = { duration: 0.01, ease }
      return {
        containerVariants: {
          hidden: { opacity: 1 },
          visible: { opacity: 1, transition: { staggerChildren: 0, delayChildren: 0 } },
        },
        itemVariants: {
          hidden: { opacity: 1, y: 0 },
          visible: { opacity: 1, y: 0, transition: instant },
        },
        statsRowVariants: {
          hidden: { opacity: 1 },
          visible: { opacity: 1, transition: { staggerChildren: 0, delayChildren: 0 } },
        },
        statItemVariants: {
          hidden: { opacity: 1, y: 0 },
          visible: { opacity: 1, y: 0, transition: instant },
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
      statsRowVariants: {
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease,
            staggerChildren: 0.09,
            delayChildren: 0.06,
          },
        },
      },
      statItemVariants: {
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.42, ease },
        },
      },
    }
  }, [reduce])

  const base = landingHeroStats?.items?.length
    ? landingHeroStats.items.filter((x) => x && (x.value != null || x.label != null))
    : []
  const stats = base.map((x, i) => ({
    value: String(x.value ?? '—'),
    label: String(x.label ?? ''),
  }))

  const ctaMotion = reduce ? {} : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 } }
  const statHover = reduce
    ? {}
    : {
        whileHover: {
          y: -4,
          scale: 1.05,
          transition: { type: 'spring', stiffness: 400, damping: 26 },
        },
      }

  return (
    <section
      id="hero"
      className="relative flex min-h-[600px] items-center justify-center overflow-hidden px-6 py-28 sm:min-h-[720px] sm:py-36"
    >
      <div
        className="hero-beam pointer-events-none absolute top-[-15%] left-1/2 z-0 h-[130%] w-[min(90vw,520px)] -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.07] to-transparent blur-[48px] mix-blend-screen"
        aria-hidden
      />

      <div
        className="hero-aurora pointer-events-none absolute top-1/2 left-1/2 z-0 aspect-square w-[min(220vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.28] blur-3xl mix-blend-screen"
        style={{
          background:
            'conic-gradient(from 210deg at 50% 50%, rgba(124, 58, 237, 0.45), rgba(217, 70, 239, 0.3), rgba(6, 182, 212, 0.38), rgba(251, 191, 36, 0.22), rgba(232, 121, 249, 0.28), rgba(124, 58, 237, 0.45))',
        }}
        aria-hidden
      />

      <div className="hero-blob-fuchsia absolute -top-40 -right-40 z-0 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="hero-blob-cyan absolute -bottom-40 -left-40 z-0 h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl" />

      <div
        className="pointer-events-none absolute inset-0 z-0 animate-mesh opacity-[0.14]"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(217, 70, 239, 0.35), transparent 65%), radial-gradient(ellipse 60% 45% at 85% 75%, rgba(6, 182, 212, 0.22), transparent 60%)',
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-0 animate-mesh-slow opacity-[0.1]"
        style={{
          background:
            'radial-gradient(ellipse 55% 40% at 20% 70%, rgba(251, 191, 36, 0.12), transparent 60%), radial-gradient(ellipse 50% 45% at 75% 25%, rgba(124, 58, 237, 0.15), transparent 55%)',
        }}
        aria-hidden
      />

      <div className="hero-orb-amber pointer-events-none absolute top-[18%] left-[6%] z-0 h-56 w-56 rounded-full bg-amber-400/25 blur-3xl sm:h-64 sm:w-64" aria-hidden />
      <div className="hero-orb-violet pointer-events-none absolute top-[22%] right-[8%] z-0 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl sm:h-56 sm:w-56" aria-hidden />

      <div className="hero-meteor hero-meteor--a" aria-hidden />
      <div className="hero-meteor hero-meteor--b" aria-hidden />
      <div className="hero-meteor hero-meteor--c" aria-hidden />
      <div className="hero-meteor hero-meteor--d" aria-hidden />
      <div className="hero-meteor hero-meteor--e" aria-hidden />
      <div className="hero-meteor hero-meteor--f" aria-hidden />
      <div className="hero-meteor hero-meteor--g" aria-hidden />
      <div className="hero-meteor hero-meteor--h" aria-hidden />
      <div className="hero-meteor hero-meteor--i" aria-hidden />
      <div className="hero-meteor hero-meteor--j" aria-hidden />

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

        <motion.div
          variants={statsRowVariants}
          className="flex flex-wrap justify-center gap-12 sm:gap-16"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={`${stat.label}-${i}`}
              variants={statItemVariants}
              {...statHover}
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
