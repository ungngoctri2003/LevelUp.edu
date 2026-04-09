import { Router } from 'express'
import { createAnonClient, createServiceClient } from '../lib/supabase.js'

const router = Router()

function normalizePaymentSource(v) {
  const src = String(v || '').trim() || 'bank_transfer'
  if (!['cash', 'bank_transfer', 'momo', 'vnpay', 'other'].includes(src)) {
    throw new Error('payment_source không hợp lệ')
  }
  return src
}

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
  const keys = ['testimonials', 'video_preview', 'admissions_info', 'landing_hero_stats', 'landing_benefits']
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
      landing_hero_stats: out.landing_hero_stats ?? null,
      landing_benefits: Array.isArray(out.landing_benefits) ? out.landing_benefits : [],
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
      id, subject_id, title, description, list_price, visible, sort_order, created_at, updated_at,
      subjects ( id, slug, name, icon_label )
    `,
    )
    .eq('visible', true)
    .order('sort_order', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** GET /api/public/sale-classes */
router.get('/sale-classes', async (_req, res) => {
  const svc = createServiceClient()
  if (!svc) {
    return res.status(503).json({
      error: 'Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY cho danh sách lớp mở bán',
    })
  }
  const { data: rows, error } = await svc
    .from('classes')
    .select('id, code, name, subject, grade_label, schedule_summary, tuition_fee, sales_note, teacher_id')
    .eq('sales_enabled', true)
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })

  const teacherIds = [...new Set((rows || []).map((row) => row.teacher_id).filter(Boolean))]
  let teacherById = {}
  if (teacherIds.length) {
    const { data: profs, error: pErr } = await svc.from('profiles').select('id, full_name').in('id', teacherIds)
    if (pErr) return res.status(500).json({ error: pErr.message })
    teacherById = Object.fromEntries((profs || []).map((row) => [row.id, row.full_name]))
  }

  res.json({
    data: (rows || []).map((row) => ({
      id: row.id,
      code: row.code || '',
      name: row.name,
      subject: row.subject,
      grade_label: row.grade_label,
      schedule_summary: row.schedule_summary || '',
      tuition_fee: row.tuition_fee != null ? Number(row.tuition_fee) : null,
      sales_note: row.sales_note || '',
      teacher_name: teacherById[row.teacher_id] || '—',
    })),
  })
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
      id, subject_id, title, description, list_price, visible, sort_order, created_at, updated_at,
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

function jsonbStringArray(val) {
  if (!Array.isArray(val)) return []
  return val.map((x) => (typeof x === 'string' ? x : String(x ?? ''))).filter(Boolean)
}

function jsonbSectionBlocks(val) {
  if (!Array.isArray(val)) return []
  return val.map((s) => ({
    heading: s?.heading != null ? String(s.heading) : '',
    body: s?.body != null ? String(s.body) : '',
  }))
}

/** CMS có thể lưu { title, url } hoặc { name, type } (không link). */
function jsonbResources(val) {
  if (!Array.isArray(val)) return []
  return val.map((r) => {
    if (typeof r === 'string') {
      const s = r.trim()
      return { name: s, title: s, type: '', url: '' }
    }
    const name = r?.name != null ? String(r.name).trim() : ''
    const title = r?.title != null ? String(r.title).trim() : ''
    const url = typeof r?.url === 'string' ? r.url.trim() : r?.href != null ? String(r.href).trim() : ''
    const type = r?.type != null ? String(r.type).trim() : ''
    return { name, title, type, url }
  })
}

/** GET /api/public/lessons/:id/details — đủ trường cho trang chi tiết (CMS). */
router.get('/lessons/:id/details', async (req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const { data, error } = await sb
    .from('lesson_details')
    .select('lesson_id, summary, teacher_name, youtube_url, outline, sections, resources, practice_hints')
    .eq('lesson_id', id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Chưa có chi tiết bài giảng' })
  const yt = data.youtube_url != null && String(data.youtube_url).trim() ? String(data.youtube_url).trim() : ''
  res.json({
    data: {
      lesson_id: data.lesson_id,
      teacher_name: data.teacher_name || '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      youtube_url: yt,
      outline: jsonbStringArray(data.outline),
      sections: jsonbSectionBlocks(data.sections),
      resources: jsonbResources(data.resources),
      practice_hints: jsonbStringArray(data.practice_hints),
    },
  })
})

/** GET /api/public/exams — không trả questions (payload nhẹ) */
router.get('/exams', async (_req, res) => {
  const sb = sbOr503(res, createAnonClient())
  if (!sb) return
  // select('*') để DB chưa chạy migration embed vẫn hoạt động (không lỗi thiếu cột content_mode/embed_src)
  const { data, error } = await sb
    .from('exams')
    .select('*')
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
    .select('id, title, subject_label, duration_minutes, question_count, level_label, assigned, published, content_mode, embed_src')
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

/** POST /api/public/class-payment-requests */
router.post('/class-payment-requests', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) {
    return res.status(503).json({
      error: 'Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY — không thể ghi yêu cầu thanh toán công khai',
    })
  }
  const { class_id, student_name, student_email, student_phone, payment_source, note } = req.body || {}
  const classId = Number(class_id)
  const name = typeof student_name === 'string' ? student_name.trim() : ''
  const email = typeof student_email === 'string' ? student_email.trim() : ''
  const phone = typeof student_phone === 'string' ? student_phone.trim() : ''
  if (!Number.isFinite(classId) || !name || !phone) {
    return res.status(400).json({ error: 'class_id, student_name, student_phone là bắt buộc' })
  }

  const { data: cls, error: cErr } = await svc
    .from('classes')
    .select('id, sales_enabled, tuition_fee')
    .eq('id', classId)
    .maybeSingle()
  if (cErr) return res.status(500).json({ error: cErr.message })
  if (!cls || cls.sales_enabled !== true) {
    return res.status(404).json({ error: 'Lớp này hiện không mở thanh toán công khai' })
  }

  let source = 'bank_transfer'
  try {
    source = normalizePaymentSource(payment_source)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const row = {
    class_id: classId,
    student_name: name,
    student_email: email || null,
    student_phone: phone,
    payment_source: source,
    payment_status: 'pending',
    amount: cls.tuition_fee != null ? Number(cls.tuition_fee) : null,
    note: typeof note === 'string' && note.trim() ? note.trim() : null,
  }
  const { data, error } = await svc
    .from('student_class_payments')
    .insert(row)
    .select('id, class_id, payment_status, payment_source, submitted_at')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ data })
})

/** POST /api/public/course-payment-requests — mua khóa học (catalog), không cần lớp mở bán */
router.post('/course-payment-requests', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) {
    return res.status(503).json({
      error: 'Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY cho yêu cầu thanh toán khóa học',
    })
  }
  const { course_id, student_name, student_email, student_phone, payment_source, note } = req.body || {}
  const courseId = Number(course_id)
  const name = typeof student_name === 'string' ? student_name.trim() : ''
  const email = typeof student_email === 'string' ? student_email.trim() : ''
  const phone = typeof student_phone === 'string' ? student_phone.trim() : ''
  if (!Number.isFinite(courseId) || !name || !phone) {
    return res.status(400).json({ error: 'course_id, student_name, student_phone là bắt buộc' })
  }

  const { data: crs, error: crsErr } = await svc
    .from('courses')
    .select('id, title, list_price, visible')
    .eq('id', courseId)
    .maybeSingle()
  if (crsErr) return res.status(500).json({ error: crsErr.message })
  if (!crs || crs.visible !== true) {
    return res.status(404).json({ error: 'Không tìm thấy khóa học hoặc khóa không hiển thị công khai' })
  }
  if (crs.list_price == null || !Number.isFinite(Number(crs.list_price))) {
    return res.status(400).json({
      error: 'Khóa học này chưa có giá niêm yết. Vui lòng liên hệ trung tâm.',
    })
  }

  let source = 'bank_transfer'
  try {
    source = normalizePaymentSource(payment_source)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const row = {
    course_id: courseId,
    student_name: name,
    student_email: email || null,
    student_phone: phone,
    payment_source: source,
    payment_status: 'pending',
    amount: Number(crs.list_price),
    note: typeof note === 'string' && note.trim() ? note.trim() : null,
  }
  const { data, error } = await svc
    .from('student_course_payments')
    .insert(row)
    .select('id, course_id, payment_status, payment_source, submitted_at')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ data })
})

export default router
