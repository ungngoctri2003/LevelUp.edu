import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal } from '../components/motion/Reveal'
import PageLoading from '../components/ui/PageLoading.jsx'
import { useAuthSession } from '../context/AuthSessionContext'
import { usePublicContent } from '../hooks/usePublicContent'
import { toYouTubeEmbedUrl, youTubeWatchUrlOrNull } from '../lib/youtubeEmbed.js'
import { buildLessonsByCourse, fetchLessonDetail, findLessonContextFromGroups } from '../services/publicApi.js'
import { getMyClasses, getMyCoursePayments, getMyPayments } from '../services/meApi.js'
import { userHasCourseAccess } from '../utils/courseAccess.js'

export default function LessonDetailPage() {
  const { lessonId } = useParams()
  const { profile, session } = useAuthSession()
  const { courses, subjects, lessons, saleClasses, loading: catLoading } = usePublicContent()
  const groups = useMemo(
    () => buildLessonsByCourse(courses, lessons, subjects),
    [courses, lessons, subjects],
  )
  const ctx = findLessonContextFromGroups(groups, lessonId ?? '')

  const [myClasses, setMyClasses] = useState([])
  const [myPayments, setMyPayments] = useState([])
  const [myCoursePayments, setMyCoursePayments] = useState([])
  const [purchaseLoaded, setPurchaseLoaded] = useState(false)

  const [row, setRow] = useState(null)
  const [loadErr, setLoadErr] = useState(null)

  const staffCanView = profile?.role === 'admin' || profile?.role === 'teacher'
  const isStudent = profile?.role === 'student'

  const courseForAccess = ctx?.subject ?? null

  const loadPurchaseContext = useCallback(async () => {
    const token = session?.access_token
    if (!token || !isStudent) {
      setMyClasses([])
      setMyPayments([])
      setMyCoursePayments([])
      setPurchaseLoaded(true)
      return
    }
    setPurchaseLoaded(false)
    try {
      const [cRes, pRes, cpRes] = await Promise.all([
        getMyClasses(token),
        getMyPayments(token),
        getMyCoursePayments(token),
      ])
      setMyClasses(Array.isArray(cRes?.data) ? cRes.data : [])
      setMyPayments(Array.isArray(pRes?.data) ? pRes.data : [])
      setMyCoursePayments(Array.isArray(cpRes?.data) ? cpRes.data : [])
    } catch {
      setMyClasses([])
      setMyPayments([])
      setMyCoursePayments([])
    } finally {
      setPurchaseLoaded(true)
    }
  }, [session?.access_token, isStudent])

  useEffect(() => {
    loadPurchaseContext()
  }, [loadPurchaseContext])

  const hasAccess = useMemo(
    () =>
      userHasCourseAccess(courseForAccess, {
        profile,
        myClasses,
        myPayments,
        myCoursePayments,
        saleClasses,
      }),
    [courseForAccess, profile, myClasses, myPayments, myCoursePayments, saleClasses],
  )

  const canViewPage = Boolean(staffCanView || hasAccess)
  const waitingPurchaseContext = isStudent && !!session?.access_token && !purchaseLoaded

  useEffect(() => {
    let cancelled = false
    if (!lessonId || !canViewPage) {
      setRow(null)
      setLoadErr(null)
      return () => {
        cancelled = true
      }
    }
    const id = Number(lessonId)
    if (!Number.isFinite(id)) {
      setRow(null)
      setLoadErr(null)
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
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
  }, [lessonId, canViewPage])

  if (!ctx && !catLoading && groups.length) {
    return <Navigate to="/bai-giang" replace />
  }

  if (catLoading && !ctx) {
    return <PageLoading variant="page" />
  }

  if (ctx && waitingPurchaseContext) {
    return <PageLoading variant="page" />
  }

  if (ctx && !canViewPage) {
    return <Navigate to="/bai-giang" replace />
  }

  if (loadErr === 'no-detail' && ctx && canViewPage) {
    return <Navigate to="/bai-giang" replace />
  }

  if (!ctx || !canViewPage) {
    if (catLoading) return <PageLoading variant="page" />
    return <div className="py-24 text-center text-slate-500">Không tìm thấy bài giảng.</div>
  }

  if (!row) {
    if (loadErr) {
      return <div className="py-24 text-center text-slate-500">Không tải được chi tiết bài giảng.</div>
    }
    return <PageLoading variant="page" />
  }

  const { subject, lesson } = ctx
  const summary = typeof row.summary === 'string' ? row.summary : ''
  const teacherName = row.teacher_name || '—'
  const youtubeUrl = [row.youtube_url, row.youtubeUrl, row.video_url]
    .map((x) => (typeof x === 'string' ? x.trim() : x != null ? String(x).trim() : ''))
    .find(Boolean) || ''
  const embedSrc = toYouTubeEmbedUrl(youtubeUrl)
  const youtubeOpenHref = embedSrc ? null : youTubeWatchUrlOrNull(youtubeUrl)
  const outline = Array.isArray(row.outline) ? row.outline.filter((x) => String(x || '').trim()) : []
  const sections = Array.isArray(row.sections)
    ? row.sections.filter((s) => String(s?.heading || '').trim() || String(s?.body || '').trim())
    : []
  const practiceHints = Array.isArray(row.practice_hints)
    ? row.practice_hints.filter((x) => String(x || '').trim())
    : []
  const resources = Array.isArray(row.resources) ? row.resources : []
  const backToCourse =
    subject.courseId != null
      ? `/bai-giang/khoa/${encodeURIComponent(String(subject.courseId))}`
      : '/bai-giang'

  const sectionTitle = (kicker, title) => (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700/90 dark:text-cyan-300/90">{kicker}</p>
      <h2 className="mt-1.5 text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">{title}</h2>
    </div>
  )

  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-6">
        <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
          <Link to="/" className="transition-colors hover:text-cyan-600 dark:hover:text-cyan-400">
            Trang chủ
          </Link>
          <span className="text-gray-300 dark:text-slate-600" aria-hidden>
            /
          </span>
          <Link to={backToCourse} className="transition-colors hover:text-cyan-600 dark:hover:text-cyan-400">
            Khóa học
          </Link>
          <span className="text-gray-300 dark:text-slate-600" aria-hidden>
            /
          </span>
          <span className="line-clamp-2 font-medium text-gray-900 dark:text-slate-200">{lesson.title}</span>
        </nav>

        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/30 dark:border-slate-600/80 dark:bg-slate-900/50 dark:shadow-black/25">
            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-500/10" aria-hidden />
            <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-cyan-400/12 blur-3xl dark:bg-cyan-500/10" aria-hidden />
            <div className="relative border-b border-gray-100 bg-linear-to-br from-cyan-500/12 via-fuchsia-500/6 to-amber-400/10 px-6 py-8 sm:px-10 sm:py-10 dark:border-slate-700/80">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-cyan-800 shadow-sm ring-1 ring-cyan-500/20 dark:bg-slate-800/90 dark:text-cyan-200 dark:ring-cyan-500/25">
                  {subject.icon} {subject.subjectName}
                </span>
                <span
                  className="inline-flex max-w-full items-center rounded-full border border-fuchsia-200/80 bg-fuchsia-50/90 px-3 py-1 text-sm font-medium text-fuchsia-900 dark:border-fuchsia-500/35 dark:bg-fuchsia-950/50 dark:text-fuchsia-200"
                  title={subject.courseTitle}
                >
                  {subject.courseTitle}
                </span>
                <span className="inline-flex rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600">
                  {lesson.level}
                </span>
                <span className="inline-flex rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600">
                  {lesson.duration}
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl sm:leading-tight">
                {lesson.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/40 pt-5 dark:border-slate-700/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-fuchsia-600 text-sm font-bold text-white shadow-md shadow-fuchsia-500/20">
                  GV
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-500">Giảng viên</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{teacherName}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 space-y-8"
        >
          {summary ? (
            <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-lg shadow-gray-200/20 dark:border-slate-600/80 dark:bg-slate-900/40 dark:shadow-black/20 sm:p-8">
              {sectionTitle('Tổng quan', 'Tóm tắt bài')}
              <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-gray-600 dark:text-slate-300">{summary}</p>
            </section>
          ) : null}

          {embedSrc ? (
            <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-lg shadow-gray-200/25 dark:border-slate-600/80 dark:bg-slate-900/40 dark:shadow-black/25">
              <div className="border-b border-gray-100 bg-linear-to-r from-gray-50/95 to-white px-6 py-5 sm:px-8 dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-900/40">
                {sectionTitle('Trực quan', 'Video bài giảng')}
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  title="Video bài giảng"
                  src={embedSrc}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </section>
          ) : youtubeUrl && youtubeOpenHref ? (
            <section className="rounded-3xl border border-amber-200/60 bg-linear-to-br from-amber-50/90 to-white p-6 shadow-lg dark:border-amber-500/20 dark:from-amber-950/30 dark:to-slate-900/40 sm:p-8">
              {sectionTitle('Trực quan', 'Video bài giảng')}
              <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                Không nhúng trực tiếp được — mở video trên YouTube.
              </p>
              <a
                href={youtubeOpenHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:opacity-95"
              >
                Mở trên YouTube
                <span aria-hidden>↗</span>
              </a>
              <p className="mt-4 break-all rounded-xl bg-white/60 px-3 py-2 font-mono text-[11px] text-gray-500 dark:bg-slate-950/40 dark:text-slate-500">
                {youtubeUrl}
              </p>
            </section>
          ) : null}

          {outline.length > 0 ? (
            <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-lg shadow-gray-200/20 dark:border-slate-600/80 dark:bg-slate-900/40 dark:shadow-black/20 sm:p-8">
              {sectionTitle('Cấu trúc', 'Dàn ý')}
              <ul className="list-none space-y-0 border-l-2 border-cyan-500/35 pl-0 dark:border-cyan-500/25">
                {outline.map((line, i) => (
                  <li
                    key={i}
                    className="relative py-2.5 pl-6 text-[15px] leading-relaxed text-gray-700 before:absolute before:left-0.5 before:top-[1.15rem] before:h-2 before:w-2 before:-translate-x-1/2 before:rounded-full before:bg-linear-to-br before:from-cyan-500 before:to-fuchsia-600 dark:text-slate-300"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {sections.length > 0 ? (
            <div className="space-y-5">
              <div className="px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700/90 dark:text-cyan-300/90">Nội dung</p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">Chi tiết theo mục</h2>
              </div>
              {sections.map((block, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.35) }}
                  className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-md shadow-gray-200/15 dark:border-slate-600/80 dark:bg-slate-900/40 dark:shadow-black/20 sm:p-8"
                >
                  <div className="flex gap-4">
                    <div className="hidden shrink-0 pt-0.5 text-sm font-bold tabular-nums text-cyan-600/80 dark:text-cyan-400/90 sm:block">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1 border-l-2 border-cyan-500/25 pl-4 dark:border-cyan-500/20 sm:border-l-0 sm:pl-0">
                      {block.heading ? (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{block.heading}</h3>
                      ) : null}
                      {block.body ? (
                        <p
                          className={`whitespace-pre-wrap text-[15px] leading-[1.75] text-gray-600 dark:text-slate-300 ${block.heading ? 'mt-3' : ''}`}
                        >
                          {block.body}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : null}

          {practiceHints.length > 0 ? (
            <section className="rounded-3xl border border-cyan-300/40 bg-linear-to-br from-cyan-50/95 via-white to-fuchsia-50/40 p-6 shadow-lg dark:border-cyan-500/20 dark:from-cyan-950/40 dark:via-slate-900/50 dark:to-fuchsia-950/20 sm:p-8">
              {sectionTitle('Luyện tập', 'Gợi ý bài tập')}
              <ol className="mt-2 space-y-3">
                {practiceHints.map((line, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-2xl border border-cyan-200/50 bg-white/80 px-4 py-3 text-[15px] leading-relaxed text-gray-800 dark:border-cyan-500/15 dark:bg-slate-900/50 dark:text-slate-200"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-cyan-500 to-fuchsia-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">{line}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {resources.length > 0 ? (
            <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-lg shadow-gray-200/20 dark:border-slate-600/80 dark:bg-slate-900/40 dark:shadow-black/20 sm:p-8">
              {sectionTitle('Tham khảo', 'Tài liệu & liên kết')}
              <ul className="divide-y divide-gray-100 dark:divide-slate-700/80">
                {resources.map((r, i) => {
                  const label =
                    (typeof r.title === 'string' && r.title.trim()) ||
                    (typeof r.name === 'string' && r.name.trim()) ||
                    ''
                  const url = typeof r.url === 'string' ? r.url.trim() : ''
                  const type = typeof r.type === 'string' && r.type.trim() ? r.type.trim() : ''
                  if (!label && !url) return null
                  return (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-cyan-600 transition hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                          >
                            {label || url}
                            <span className="ml-1 text-xs opacity-70" aria-hidden>
                              ↗
                            </span>
                          </a>
                        ) : (
                          <span className="font-medium text-gray-800 dark:text-slate-200">
                            {label || '—'}
                            {type ? (
                              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-slate-500">({type})</span>
                            ) : null}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          {!summary &&
          !embedSrc &&
          !youtubeUrl &&
          outline.length === 0 &&
          sections.length === 0 &&
          practiceHints.length === 0 &&
          resources.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/90 px-6 py-14 text-center dark:border-slate-600 dark:bg-slate-800/40">
              <div className="mx-auto h-12 w-12 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600" aria-hidden />
              <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                Chưa có nội dung chi tiết cho bài giảng này. Vui lòng quay lại sau hoặc liên hệ trung tâm.
              </p>
            </section>
          ) : null}
        </motion.div>

        <div className="mt-12 border-t border-gray-200/80 pt-8 dark:border-slate-700/80">
          <Link
            to={backToCourse}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-cyan-300/60 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-cyan-500/30 dark:hover:bg-slate-700/80"
          >
            <span aria-hidden>←</span>
            Quay lại chương trình khóa học
          </Link>
        </div>
      </div>
    </div>
  )
}
