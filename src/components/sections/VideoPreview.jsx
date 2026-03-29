import { motion } from 'framer-motion'
import { Reveal } from '../motion/Reveal'
import { usePublicContent } from '../../hooks/usePublicContent'

function toEmbedSrc(url) {
  if (!url || typeof url !== 'string') return ''
  const u = url.trim()
  if (!u) return ''
  if (/youtube\.com\/embed\//i.test(u)) return u
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  if (/^https?:\/\//i.test(u)) return u
  return ''
}

export default function VideoPreview() {
  const { videoPreview } = usePublicContent()
  const vp = videoPreview && typeof videoPreview === 'object' ? videoPreview : {}
  const features = Array.isArray(vp.features) ? vp.features : []
  const title = vp.title || 'Video bài giảng minh họa'
  const description =
    vp.description || 'Nội dung video và mô tả được quản trị viên cấu hình trong hệ thống.'
  const embedSrc = toEmbedSrc(vp.embed_url)
  const overlayTitle = vp.overlay_title || 'Đại số lớp 10 — Ôn tập tổng hợp'
  const overlaySub = vp.overlay_subtitle || 'Video bài giảng có sẵn khi đăng ký'

  return (
    <section id="video-preview" className="bg-gray-50 py-24 dark:bg-slate-900 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <motion.div
              whileHover={{ scale: embedSrc ? 1 : 1.02 }}
              transition={{ duration: 0.35 }}
              className="aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950 via-fuchsia-900 to-cyan-900 shadow-2xl shadow-fuchsia-900/30"
            >
              {embedSrc ? (
                <iframe
                  title={title}
                  src={embedSrc}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 p-10">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/10"
                  >
                    <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </motion.div>
                  <p className="text-center text-lg font-medium text-white/90">{overlayTitle}</p>
                  <p className="text-center text-sm text-white/70">{overlaySub}</p>
                </div>
              )}
            </motion.div>
          </Reveal>

          <Reveal delay={0.2}>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                {title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-slate-400">{description}</p>
              <ul className="mt-8 space-y-4">
                {features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.45 }}
                    className="flex items-center gap-4 text-gray-600 dark:text-slate-400"
                  >
                    <motion.span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                    >
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.span>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
