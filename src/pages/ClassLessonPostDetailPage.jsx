import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import { useAuthSession } from '../context/AuthSessionContext'
import { getMyClassLessonPost } from '../services/meApi.js'
import { toYouTubeEmbedUrl } from '../lib/youtubeEmbed.js'

function lineItemText(item) {
  if (typeof item === 'string') return item
  if (item != null && typeof item === 'object') {
    if (typeof item.text === 'string') return item.text
    if (typeof item.label === 'string') return item.label
  }
  return '—'
}

function hasStructuredDetails(details) {
  if (!details) return false
  if (String(details.summary || '').trim()) return true
  if (details.youtube_url != null && String(details.youtube_url).trim()) return true
  if (Array.isArray(details.outline) && details.outline.length) return true
  if (
    Array.isArray(details.sections) &&
    details.sections.some((s) => String(s?.heading || '').trim() || String(s?.body || '').trim())
  )
    return true
  if (Array.isArray(details.practice_hints) && details.practice_hints.length) return true
  return false
}

export default function ClassLessonPostDetailPage() {
  const { postId } = useParams()
  const { session } = useAuthSession()
  const token = session?.access_token

  const [row, setRow] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const id = Number(postId)
    if (!token || !Number.isFinite(id)) {
      setLoading(false)
      setRow(null)
      setErr(!token ? 'need-auth' : 'bad-id')
      return () => {
        cancelled = true
      }
    }
    setLoading(true)
    setErr(null)
    ;(async () => {
      try {
        const res = await getMyClassLessonPost(token, id)
        if (cancelled) return
        setRow(res?.data ?? null)
        setErr(res?.data ? null : 'empty')
      } catch (e) {
        if (cancelled) return
        setRow(null)
        setErr(e?.message || 'load-failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, postId])

  if (!Number.isFinite(Number(postId))) {
    return (
      <div className="py-24 text-center text-slate-500">
        <p>Đường dẫn không hợp lệ.</p>
        <Link to="/lop-hoc" className="mt-4 inline-block text-cyan-600 hover:text-cyan-500 dark:text-cyan-400">
          ← Lớp học
        </Link>
      </div>
    )
  }

  if (err === 'need-auth') {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-600 dark:text-slate-400">Đăng nhập để xem nội dung bài giảng lớp.</p>
        <Link
          to="/?auth=login"
          className="mt-4 inline-block font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
        >
          Đăng nhập
        </Link>
      </div>
    )
  }

  if (loading) {
    return <div className="py-24 text-center text-slate-500">Đang tải…</div>
  }

  if (err || !row) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          {err === 'load-failed' ? 'Không tải được bài giảng.' : 'Không tìm thấy bài giảng hoặc bạn chưa được ghi danh lớp.'}
        </p>
        <Link to="/lop-hoc" className="mt-4 inline-block font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
          ← Lớp học
        </Link>
      </div>
    )
  }

  const details = row.details
  const structured = hasStructuredDetails(details)
  const bodyLegacy = typeof row.body === 'string' ? row.body : ''
  const summary = structured ? details.summary || '' : ''
  const teacherName = structured ? details.teacher_name || '—' : '—'
  const embedSrc = structured && details.youtube_url ? toYouTubeEmbedUrl(details.youtube_url) : ''
  const outline = structured && Array.isArray(details.outline) ? details.outline : []
  const sections = structured && Array.isArray(details.sections) ? details.sections : []
  const practiceHints = structured && Array.isArray(details.practice_hints) ? details.practice_hints : []

  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <nav className="mb-8 text-sm text-gray-500 dark:text-slate-400">
          <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link to="/lop-hoc" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Lớp học
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-slate-200">Lớp học</span>
        </nav>

        <Reveal>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/50 px-6 py-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300/90">
              {row.class_name}
              {row.class_code ? (
                <span className="ml-2 font-normal text-emerald-700/85 dark:text-emerald-200/80">({row.class_code})</span>
              ) : null}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{row.title}</h1>
            <p className="mt-2 text-sm text-emerald-900/80 dark:text-emerald-200/75">
              {row.duration_display}
              {row.subject ? ` · ${row.subject}` : ''}
            </p>
            {structured ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                Giảng viên: <span className="font-medium text-gray-800 dark:text-slate-200">{teacherName}</span>
              </p>
            ) : null}
          </div>
        </Reveal>

        {structured ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-slate-900 shadow-xl dark:border-slate-600"
            >
              <div className="relative aspect-video w-full">
                {embedSrc ? (
                  <iframe
                    src={embedSrc}
                    title={`Video — ${row.title}`}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-6 text-center">
                    <p className="text-sm text-slate-400">
                      {details.youtube_url && String(details.youtube_url).trim()
                        ? 'Link YouTube không hợp lệ — vui lòng báo giáo viên kiểm tra URL.'
                        : 'Chưa gắn video YouTube cho bài giảng này.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="mt-10 space-y-10">
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tóm tắt</h2>
                <p className="mt-3 leading-relaxed text-gray-600 dark:text-slate-300">{summary || '—'}</p>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dàn ý bài giảng</h2>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-gray-600 dark:text-slate-300">
                  {outline.length ? (
                    outline.map((item, i) => <li key={i}>{lineItemText(item)}</li>)
                  ) : (
                    <li className="list-none pl-0 text-gray-500 dark:text-slate-500">Chưa có dàn ý.</li>
                  )}
                </ol>
              </section>

              {sections.map((sec, i) => (
                <section
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{sec.heading || `Mục ${i + 1}`}</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600 dark:text-slate-300">{sec.body || '—'}</p>
                </section>
              ))}

              <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bài tập gợi ý</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700 dark:text-slate-300">
                  {practiceHints.length ? (
                    practiceHints.map((h, i) => <li key={i}>{lineItemText(h)}</li>)
                  ) : (
                    <li className="list-none pl-0 text-gray-500 dark:text-slate-500">Chưa có gợi ý.</li>
                  )}
                </ul>
              </section>
            </div>
          </>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-xl dark:border-emerald-900/40 dark:bg-slate-900/80">
            {bodyLegacy.trim() ? (
              <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800 dark:text-slate-200">
                {bodyLegacy}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-slate-500">Giáo viên chưa soạn nội dung chi tiết cho bài giảng này.</p>
            )}
          </div>
        )}

        <p className="mt-12 text-center">
          <Link
            to={row.class_id != null ? `/lop-hoc/${encodeURIComponent(String(row.class_id))}` : '/lop-hoc'}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            ← Quay lại lớp
          </Link>
        </p>
      </div>
    </div>
  )
}
