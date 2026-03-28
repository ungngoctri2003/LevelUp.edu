import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import { usePublicContent } from '../hooks/usePublicContent'
import { buildLessonsBySubject, fetchLessonDetail, findLessonContextFromGroups } from '../services/publicApi.js'

export default function LessonDetailPage() {
  const { lessonId } = useParams()
  const { subjects, lessons, loading: catLoading } = usePublicContent()
  const groups = useMemo(() => buildLessonsBySubject(subjects, lessons), [subjects, lessons])
  const ctx = findLessonContextFromGroups(groups, lessonId ?? '')

  const [row, setRow] = useState(null)
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!lessonId) return
      setLoadErr(null)
      const d = await fetchLessonDetail(lessonId)
      if (cancelled) return
      if (!d) {
        setLoadErr('no-detail')
        setRow(null)
        return
      }
      setRow(d)
    })()
    return () => {
      cancelled = true
    }
  }, [lessonId])

  if (!ctx && !catLoading && groups.length) {
    return <Navigate to="/bai-giang" replace />
  }

  if (catLoading && !ctx) {
    return <div className="py-24 text-center text-slate-500">Đang tải…</div>
  }

  if (loadErr === 'no-detail' && ctx) {
    return <Navigate to="/bai-giang" replace />
  }

  if (!ctx || !row) {
    return (
      <div className="py-24 text-center text-slate-500">
        {loadErr ? 'Không tải được chi tiết bài giảng.' : 'Đang tải chi tiết…'}
      </div>
    )
  }

  const { subject, lesson } = ctx
  const summary = row.summary || ''
  const teacherName = row.teacher_name || '—'
  const outline = Array.isArray(row.outline) ? row.outline : []
  const sections = Array.isArray(row.sections) ? row.sections : []
  const resources = Array.isArray(row.resources) ? row.resources : []
  const practiceHints = Array.isArray(row.practice_hints) ? row.practice_hints : []

  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <nav className="mb-8 text-sm text-gray-500 dark:text-slate-400">
          <Link to="/" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link to="/bai-giang" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Bài giảng
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-slate-200">{lesson.title}</span>
        </nav>

        <Reveal>
          <div className="flex flex-wrap items-start gap-3">
            <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-300">
              {subject.icon} {subject.name}
            </span>
            <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {lesson.level}
            </span>
            <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              ⏱ {lesson.duration}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{lesson.title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Giảng viên: <span className="font-medium text-gray-700 dark:text-slate-300">{teacherName}</span>
          </p>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 shadow-xl dark:border-slate-600"
        >
          <div className="relative flex aspect-video items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-fuchsia-500/10" />
            <button
              type="button"
              className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-cyan-600 shadow-lg ring-4 ring-white/30 transition hover:scale-105"
              aria-label="Phát video bài giảng"
            >
              <svg className="ml-1 h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </motion.div>

        <div className="mt-10 space-y-10">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tóm tắt</h2>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-slate-300">{summary}</p>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dàn ý bài giảng</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-gray-600 dark:text-slate-300">
              {outline.map((item, i) => (
                <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
              ))}
            </ol>
          </section>

          {sections.map((sec, i) => (
            <section
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{sec.heading}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600 dark:text-slate-300">{sec.body}</p>
            </section>
          ))}

          <section className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/50 p-6 dark:border-cyan-500/30 dark:bg-cyan-950/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bài tập gợi ý</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700 dark:text-slate-300">
              {practiceHints.map((h, i) => (
                <li key={i}>{typeof h === 'string' ? h : JSON.stringify(h)}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tài liệu đính kèm</h2>
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-slate-700">
              {resources.map((r, i) => (
                <li key={i} className="flex items-center justify-between py-3 first:pt-0">
                  <span className="text-gray-700 dark:text-slate-200">{r.name}</span>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                    {r.type}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            to="/bai-giang"
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Quay lại danh sách bài giảng
          </Link>
        </div>
      </div>
    </div>
  )
}
