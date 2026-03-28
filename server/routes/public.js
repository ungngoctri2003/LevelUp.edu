import { Router } from 'express'
import { createAnonClient, createServiceClient } from '../lib/supabase.js'

const router = Router()

function sbOr503(res, client) {
  if (!client) {
    res.status(503).json({ error: 'Supabase chưa cấu hình (URL / anon key)' })
    return null
  }
  return client
}

/**
 * GET /api/public/cms — testimonials, video_preview, admissions_info (system_settings).
 * Cần SUPABASE_SERVICE_ROLE_KEY vì RLS system_settings chỉ admin.
 */
router.get('/cms', async (_req, res) => {
  const svc = createServiceClient()
  if (!svc) {
    return res.status(503).json({
      error: 'Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY cho endpoint CMS công khai',
    })
  }
  const keys = ['testimonials', 'video_preview', 'admissions_info']
  const { data, error } = await svc.from('system_settings').select('key, value').in('key', keys)
  if (error) return res.status(500).json({ error: error.message })
  const out = {}
  for (const row of data || []) {
    out[row.key] = row.value
  }
  res.json({
    data: {
      testimonials: out.testimonials ?? [],
      video_preview: out.video_preview ?? {},
      admissions_info: out.admissions_info ?? {},
    },
  })
})

/** GET /api/public/subjects */
router.get('/subjects', async (_req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const { data, error } = await sb
    .from('subjects')
    .select('id, slug, name, icon_label, sort_order')
    .order('sort_order', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** GET /api/public/courses */
router.get('/courses', async (_req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const { data, error } = await sb
    .from('courses')
    .select(
      `
      id, subject_id, title, description, visible, sort_order, created_at, updated_at,
      subjects ( id, slug, name, icon_label )
    `,
    )
    .eq('visible', true)
    .order('sort_order', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** GET /api/public/courses/:id */
router.get('/courses/:id', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const { data, error } = await sb
    .from('courses')
    .select(
      `
      id, subject_id, title, description, visible, sort_order, created_at, updated_at,
      subjects ( id, slug, name, icon_label )
    `,
    )
    .eq('id', id)
    .eq('visible', true)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Không tìm thấy khóa học' })
  res.json({ data })
})

/** GET /api/public/lessons?subject_id= */
router.get('/lessons', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  let q = sb
    .from('lessons')
    .select(
      'id, subject_id, title, duration_minutes, level_label, sort_order, created_at, updated_at',
    )
    .order('sort_order', { ascending: true })
  const sid = req.query.subject_id
  if (sid !== undefined && sid !== '') {
    const n = Number(sid)
    if (!Number.isFinite(n)) return res.status(400).json({ error: 'subject_id không hợp lệ' })
    q = q.eq('subject_id', n)
  }
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** GET /api/public/lessons/:id */
router.get('/lessons/:id', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const { data, error } = await sb
    .from('lessons')
    .select(
      'id, subject_id, title, duration_minutes, level_label, sort_order, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Không tìm thấy bài giảng' })
  res.json({ data })
})

/** GET /api/public/lessons/:id/details */
router.get('/lessons/:id/details', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const { data, error } = await sb
    .from('lesson_details')
    .select('lesson_id, summary, teacher_name, outline, sections, resources, practice_hints')
    .eq('lesson_id', id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Chưa có chi tiết bài giảng' })
  res.json({ data })
})

/** GET /api/public/exams — không trả questions (payload nhẹ) */
router.get('/exams', async (_req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const { data, error } = await sb
    .from('exams')
    .select(
      'id, title, subject_label, duration_minutes, question_count, level_label, published, assigned, created_at, updated_at',
    )
    .eq('published', true)
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** GET /api/public/exams/:id — gồm questions (RLS: chỉ đề published cho anon) */
router.get('/exams/:id', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const { data, error } = await sb
    .from('exams')
    .select(
      'id, title, subject_label, duration_minutes, question_count, questions, level_label, published, assigned, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Không tìm thấy đề' })
  res.json({ data })
})

/** GET /api/public/news */
router.get('/news', async (_req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const { data, error } = await sb
    .from('news_posts')
    .select('id, title, excerpt, body, category, published_on, slug, created_at, updated_at')
    .order('published_on', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** GET /api/public/news/:id — chi tiết một tin (deep link / F5) */
router.get('/news/:id', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const { data, error } = await sb
    .from('news_posts')
    .select('id, title, excerpt, body, category, published_on, slug, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Không tìm thấy tin' })
  res.json({ data })
})

/** GET /api/public/teachers — landing */
router.get('/teachers', async (_req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const { data, error } = await sb
    .from('public_teacher_profiles')
    .select('id, user_id, name, bio, initial, color_token, avatar_url, sort_order')
    .order('sort_order', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** POST /api/public/marketing-leads */
router.post('/marketing-leads', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const { full_name, email, phone, course_interest } = req.body || {}
  const fn = typeof full_name === 'string' ? full_name.trim() : ''
  const em = typeof email === 'string' ? email.trim() : ''
  const ph = typeof phone === 'string' ? phone.trim() : ''
  if (!fn || !em || !ph) {
    return res.status(400).json({ error: 'full_name, email, phone là bắt buộc' })
  }
  const row = {
    full_name: fn,
    email: em,
    phone: ph,
    course_interest:
      typeof course_interest === 'string' && course_interest.trim()
        ? course_interest.trim()
        : null,
  }
  const { data, error } = await sb.from('marketing_leads').insert(row).select('id').single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ data })
})

/**
 * POST /api/public/admission-applications
 * Schema RLS chỉ cho admin — cần SUPABASE_SERVICE_ROLE_KEY trên server.
 */
router.post('/admission-applications', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) {
    return res.status(503).json({
      error:
        'Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY — không thể ghi đơn tuyển sinh từ API công khai',
    })
  }
  const { student_name, parent_phone, grade_label, notes } = req.body || {}
  const sn = typeof student_name === 'string' ? student_name.trim() : ''
  const pp = typeof parent_phone === 'string' ? parent_phone.trim() : ''
  const gl = typeof grade_label === 'string' ? grade_label.trim() : ''
  if (!sn || !pp || !gl) {
    return res.status(400).json({ error: 'student_name, parent_phone, grade_label là bắt buộc' })
  }
  const row = {
    student_name: sn,
    parent_phone: pp,
    grade_label: gl,
    status: 'new',
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
  }
  const { data, error } = await svc
    .from('admission_applications')
    .insert(row)
    .select('id, submitted_at, status')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ data })
})

export default router
