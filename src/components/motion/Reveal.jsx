import { motion, useReducedMotion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 32,
  once = true,
  variant = 'fadeUp',
  scale = 0.97,
}) {
  const reduce = useReducedMotion()
  const duration = reduce ? 0.01 : 0.55
  const d = reduce ? 0 : delay
  const yMove = reduce ? 0 : y
  const useScale = variant === 'fadeUpScale' && !reduce
  const fromScale = useScale ? scale : 1

  return (
    <motion.div
      initial={{ opacity: reduce ? 1 : 0, y: yMove, scale: fromScale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once, margin: '-50px' }}
      transition={{ duration: duration, delay: d, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const staggerItemVariants = (reduce) => ({
  hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduce ? 0.01 : 0.45, ease },
  },
})

export function RevealStagger({ children, className = '', stagger = 0.1 }) {
  const reduce = useReducedMotion()
  const st = reduce ? 0 : stagger

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: { opacity: reduce ? 1 : 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: st, delayChildren: reduce ? 0 : 0.04 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className = '' }) {
  const reduce = useReducedMotion()
  const variants = staggerItemVariants(reduce)
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  )
}

export const itemVariants = staggerItemVariants(false)
