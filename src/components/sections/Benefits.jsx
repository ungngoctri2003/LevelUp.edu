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
    <section id="benefits" className="bg-gray-50 py-24 dark:bg-slate-900 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            Vì sao chọn LevelUp.edu?
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-slate-400">
            Học nhiều môn trên một nền tảng — linh hoạt, hiện đại và hiệu quả
          </p>
        </Reveal>
        <RevealStagger className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((benefit, idx) => (
            <RevealItem key={`${benefit.title}-${idx}`}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="group relative h-full overflow-hidden rounded-2xl border border-transparent bg-white p-8 shadow-lg transition-shadow duration-300 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="mb-5 inline-flex rounded-2xl bg-cyan-100 p-4 text-cyan-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-fuchsia-600 group-hover:text-white group-hover:shadow-lg">
                  <BenefitIcon name={benefit.iconKey} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                <p className="mt-3 leading-relaxed text-gray-600 dark:text-slate-400">{benefit.description}</p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
