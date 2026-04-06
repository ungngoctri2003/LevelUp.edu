import { motion } from 'framer-motion'
import { Reveal, RevealStagger, RevealItem } from '../motion/Reveal'
import { BenefitIcon, DEFAULT_BENEFIT_ROWS } from './benefitIcons.jsx'

export default function Benefits() {
  const rows = DEFAULT_BENEFIT_ROWS.map((b) => ({
    iconKey: b.icon,
    title: b.title,
    description: b.description,
  }))

  return (
    <section id="benefits" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-4xl border border-white/60 bg-white/58 px-6 py-10 shadow-[0_30px_90px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/40 dark:ring-white/10 sm:px-10 sm:py-12 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-100/40 via-transparent to-fuchsia-100/35 dark:from-cyan-500/8 dark:via-transparent dark:to-fuchsia-500/10" />
          <div className="relative">
            <Reveal variant="fadeUpScale" className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
                Vì sao chọn LevelUp.edu?
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-700 dark:text-slate-300">
                Học nhiều môn trên một nền tảng — linh hoạt, hiện đại và hiệu quả
              </p>
            </Reveal>
            <RevealStagger className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {rows.map((benefit, idx) => (
                <RevealItem key={`${benefit.title}-${idx}`}>
                  <motion.div
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    className="group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/88 p-8 shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:border-slate-700/80 dark:bg-slate-800/80"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-cyan-400 via-fuchsia-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="mb-5 inline-flex rounded-2xl bg-cyan-100 p-4 text-cyan-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-linear-to-br group-hover:from-cyan-500 group-hover:to-fuchsia-600 group-hover:text-white group-hover:shadow-lg">
                      <BenefitIcon name={benefit.iconKey} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{benefit.title}</h3>
                    <p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">{benefit.description}</p>
                  </motion.div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </div>
    </section>
  )
}
