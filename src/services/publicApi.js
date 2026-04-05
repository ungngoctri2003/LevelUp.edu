import { apiFetch } from '../lib/api.js'

function viDate(d) {
  if (!d) return ''
  try {
    const x = typeof d === 'string' ? new Date(d) : d
    return x.toLocaleDateString('vi-VN')
  } catch {
    return String(d)
  }
}

function mapNewsRow(n) {
  if (!n) return null
  return {
    id: n.id,
    title: n.title,
    date: viDate(n.published_on),
    excerpt: n.excerpt || '',
    body: n.body || '',
    category: n.category || 'Tin tức',
    slug: n.slug,
  }
}

/** @returns {Promise<{ courses: object[], exams: object[], news: object[], teachers: object[], subjects: object[], lessons: object[] }>} */
export async function fetchPublicCatalog() {
  const [coursesRes, examsRes, newsRes, teachersRes, subjectsRes, lessonsRes] = await Promise.all([
    apiFetch('/api/public/courses'),
    apiFetch('/api/public/exams'),
    apiFetch('/api/public/news'),
    apiFetch('/api/public/teachers'),
    apiFetch('/api/public/subjects'),
    apiFetch('/api/public/lessons'),
  ])

  const courses = (coursesRes.data || [])
    .filter((c) => c.visible !== false)
    .map((c) => ({
      id: c.id,
      subject: c.subjects?.name || '—',
      subject_id: c.subject_id,
      title: c.title,
      description: c.description || '',
      visible: c.visible !== false,
      sort_order: c.sort_order,
    }))

  const exams = (examsRes.data || [])
    .filter((e) => e.published !== false)
    .map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject_label,
      duration: e.duration_minutes,
      questions: e.question_count,
      level: e.level_label || '',
      assigned: !!e.assigned,
      published: e.published !== false,
      contentMode: e.content_mode === 'embed' ? 'embed' : 'mcq',
      embedSrc: typeof e.embed_src === 'string' ? e.embed_src : '',
    }))

  const news = (newsRes.data || []).map((n) => mapNewsRow(n)).filter(Boolean)

  const teachers = (teachersRes.data || []).map((t) => ({
    id: t.id,
    user_id: t.user_id,
    name: t.name,
    bio: t.bio || '',
    initial: t.initial || t.name?.charAt(0) || '?',
    color: t.color_token || 'indigo',
    imageSrc: t.avatar_url || '',
  }))

  return {
    courses,
    exams,
    news,
    teachers,
    subjects: subjectsRes.data || [],
    lessons: lessonsRes.data || [],
  }
}

/**
 * Chi tiết đề (có questions JSON). RLS: đề unpublished trả 404 với client anon.
 * @returns {Promise<object|null>}
 */
/** @returns {Promise<object|null>} */
export async function fetchPublicNewsById(newsId) {
  const id = Number(newsId)
  if (!Number.isFinite(id)) return null
  try {
    const res = await apiFetch(`/api/public/news/${id}`)
    return mapNewsRow(res.data)
  } catch {
    return null
  }
}

export async function fetchPublicExamById(examId) {
  const id = Number(examId)
  if (!Number.isFinite(id)) return null
  try {
    const res = await apiFetch(`/api/public/exams/${id}`)
    return res.data || null
  } catch {
    return null
  }
}

/** Chuẩn hóa mảng questions từ DB: { text, options[], answer } */
export function normalizeExamQuestions(raw) {
  const arr = Array.isArray(raw) ? raw : []
  return arr
    .map((q, i) => {
      const text = typeof q?.text === 'string' ? q.text : ''
      const options = Array.isArray(q?.options) ? q.options.filter((x) => typeof x === 'string') : []
      const answer = typeof q?.answer === 'string' ? q.answer : ''
      if (!text || options.length === 0 || !answer) return null
      return { id: i + 1, text, options, answer }
    })
    .filter(Boolean)
}

export async function postMarketingLead(body) {
  return apiFetch('/api/public/marketing-leads', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function postAdmissionApplication(body) {
  return apiFetch('/api/public/admission-applications', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function fetchLessonDetail(lessonId) {
  const id = Number(lessonId)
  if (!Number.isFinite(id)) return null
  try {
    const res = await apiFetch(`/api/public/lessons/${id}/details`)
    return res.data
  } catch {
    return null
  }
}

/** Gom lessons theo môn (slug) cho UI Bài giảng */
export function buildLessonsBySubject(subjects, lessons) {
  const bySubject = new Map()
  for (const s of subjects || []) {
    bySubject.set(s.id, { id: s.slug, name: s.name, icon: s.icon_label || '📘', lessons: [] })
  }
  for (const L of lessons || []) {
    const bucket = bySubject.get(L.subject_id)
    if (!bucket) continue
    bucket.lessons.push({
      id: L.id,
      title: L.title,
      duration: L.duration_minutes != null ? `${L.duration_minutes} phút` : '—',
      level: L.level_label || '—',
    })
  }
  return [...bySubject.values()].filter((b) => b.lessons.length > 0)
}

/**
 * Khóa học (course) bao trùm; bên trong là bài giảng cùng subject_id với khóa.
 * Nếu nhiều khóa trùng môn, mỗi khóa hiển thị cùng danh sách bài — cần course_id trên lessons để tách chính xác (tương lai).
 */
export function buildLessonsByCourse(courses, lessons, subjects) {
  const subjectById = new Map((subjects || []).map((s) => [Number(s.id), s]))
  return (courses || [])
    .filter((c) => c.visible !== false)
    .map((c) => {
      const sid = c.subject_id != null ? Number(c.subject_id) : NaN
      const sub = Number.isFinite(sid) ? subjectById.get(sid) : null
      const lessonItems = (lessons || [])
        .filter((L) => Number(L.subject_id) === sid)
        .map((L) => ({
          id: L.id,
          title: L.title,
          duration: L.duration_minutes != null ? `${L.duration_minutes} phút` : '—',
          level: L.level_label || '—',
        }))
      return {
        id: String(c.id),
        courseId: c.id,
        courseTitle: c.title,
        courseDescription: typeof c.description === 'string' ? c.description : '',
        subjectName: sub?.name || c.subject || '—',
        subjectSlug: sub?.slug || '',
        icon: sub?.icon_label || '📘',
        lessons: lessonItems,
      }
    })
}

export function findLessonContextFromGroups(groups, lessonId) {
  const id = Number(lessonId)
  if (!Number.isFinite(id)) return null
  for (const sub of groups || []) {
    const lesson = sub.lessons?.find((l) => l.id === id)
    if (lesson) return { subject: sub, lesson }
  }
  return null
}
