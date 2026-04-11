import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createServiceClient } from '../lib/supabase.js'
import {
  allMcqSourceIndicesAnswered,
  gradeMcqAttempt,
  normalizeMcqForTaking,
  stripMcqAnswersForClient,
} from '../../src/lib/mcqQuestions.js'
import { scheduleRows } from '../../src/services/teacherQueries.js'

const router = Router()

router.use(requireAuth)

/** Postgres bigint / JSON có thể là number hoặc string — cần thống nhất khi dùng Set.has */
function nid(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function normalizePaymentSource(v) {
  const src = String(v || '').trim() || 'bank_transfer'
  if (!['cash', 'bank_transfer', 'momo', 'vnpay', 'other'].includes(src)) {
    throw new Error('payment_source không hợp lệ')
  }
  return src
}

/** GET /api/me/profile */
router.get('/profile', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { data: profile, error: pErr } = await sb
    .from('profiles')
    .select('id, email, full_name, phone, role, account_status, created_at, updated_at')
    .eq('id', uid)
    .maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (!profile) return res.status(404).json({ error: 'Chưa có profile' })

  let student = null
  let teacher = null
  if (profile.role === 'student') {
    const { data } = await sb
      .from('student_profiles')
      .select('user_id, grade_label, status, source, joined_at, external_ref')
      .eq('user_id', uid)
      .maybeSingle()
    student = data
  }
  if (profile.role === 'teacher') {
    const { data } = await sb
      .from('teacher_profiles')
      .select('user_id, subjects_summary, approval_status, class_count_cache')
      .eq('user_id', uid)
      .maybeSingle()
    teacher = data
  }

  res.json({ data: { profile, student_profile: student, teacher_profile: teacher } })
})

/** GET /api/me/class-lesson-posts — bài giảng giáo viên đăng trong các lớp học viên đã ghi danh */
router.get('/class-lesson-posts', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { data: profile } = await sb.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên xem được danh sách bài giảng lớp.' })
  }
  const { data, error } = await sb
    .from('teacher_lesson_posts')
    .select(
      'id, class_id, title, duration_display, view_count, updated_at, classes ( id, name, code, subject )',
    )
    .order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  const mapped = (data || []).map((row) => ({
    id: row.id,
    class_id: row.class_id,
    class_name: row.classes?.name || `Lớp ${row.class_id}`,
    class_code: row.classes?.code || '',
    subject: row.classes?.subject || '',
    title: row.title,
    duration_display: row.duration_display || '—',
    view_count: row.view_count ?? 0,
    updated_at: row.updated_at,
  }))
  res.json({ data: mapped })
})

/** GET /api/me/class-lesson-posts/:id — meta + chi tiết dạng lesson_details + body cũ (RLS) */
router.get('/class-lesson-posts/:id', async (req, res) => {
  const sb = req.supabaseUser
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const { data: post, error } = await sb
    .from('teacher_lesson_posts')
    .select(
      `
      id, class_id, title, body, duration_display, view_count, updated_at,
      classes ( id, name, code, subject ),
      teacher_lesson_post_details (
        summary, teacher_name, youtube_url, outline, sections, practice_hints
      )
    `,
    )
    .eq('id', id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài giảng hoặc bạn không có quyền xem.' })
  }
  const rawDet = post.teacher_lesson_post_details
  const detRow = Array.isArray(rawDet) ? rawDet[0] : rawDet
  const details = detRow
    ? {
        summary: detRow.summary ?? '',
        teacher_name: detRow.teacher_name ?? '',
        youtube_url: detRow.youtube_url ?? null,
        outline: Array.isArray(detRow.outline) ? detRow.outline : [],
        sections: Array.isArray(detRow.sections) ? detRow.sections : [],
        practice_hints: Array.isArray(detRow.practice_hints) ? detRow.practice_hints : [],
      }
    : null
  res.json({
    data: {
      id: post.id,
      class_id: post.class_id,
      class_name: post.classes?.name || `Lớp ${post.class_id}`,
      class_code: post.classes?.code || '',
      subject: post.classes?.subject || '',
      title: post.title,
      body: post.body ?? '',
      duration_display: post.duration_display || '—',
      view_count: post.view_count ?? 0,
      updated_at: post.updated_at,
      details,
    },
  })
})

/** GET /api/me/class-schedule — buổi học theo lớp đã ghi danh (RLS schedule_slots + classes) */
router.get('/class-schedule', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { data: profile } = await sb.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên xem được lịch lớp.' })
  }
  const { data, error } = await sb
    .from('schedule_slots')
    .select(
      'id, class_id, day_label, time_range, room, starts_at, ends_at, delivery_mode, room_note, classes ( id, name, code, subject, grade_label )',
    )
  if (error) return res.status(500).json({ error: error.message })
  const rows = data || []
  const classesById = {}
  for (const r of rows) {
    const cid = r.class_id
    const c = r.classes
    if (c != null && cid != null) {
      classesById[cid] = {
        id: c.id ?? cid,
        name: c.name,
        subject: c.subject,
        grade_label: c.grade_label,
      }
    }
  }
  const slots = rows.map((r) => {
    const { classes: _cls, ...rest } = r
    return rest
  })
  const mapped = scheduleRows(slots, classesById)
  res.json({ data: mapped })
})

/** GET /api/me/classes — lớp đã ghi danh + số liệu nhanh cho khu học viên */
router.get('/classes', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) return res.status(503).json({ error: 'Máy chủ chưa cấu hình đủ để tải dữ liệu lớp học.' })
  const uid = req.authUser.id
  const { data: profile, error: pErr } = await svc.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên xem được lớp học của mình.' })
  }

  const { data: rows, error } = await svc
    .from('class_enrollments')
    .select(
      `
      class_id, enrolled_at, avg_score, attendance_pct,
      classes ( id, code, name, subject, grade_label, schedule_summary, teacher_id )
    `,
    )
    .eq('student_id', uid)
    .order('enrolled_at', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })

  const enrollments = rows || []
  const classIds = enrollments.map((row) => row.class_id).filter((v) => Number.isFinite(Number(v)))
  const teacherIds = [...new Set(enrollments.map((row) => row.classes?.teacher_id).filter(Boolean))]

  const [teachersRes, lessonsRes, schedulesRes, assignmentsRes, examsRes] = await Promise.all([
    teacherIds.length
      ? svc.from('profiles').select('id, full_name').in('id', teacherIds)
      : Promise.resolve({ data: [], error: null }),
    classIds.length
      ? svc.from('teacher_lesson_posts').select('class_id').in('class_id', classIds)
      : Promise.resolve({ data: [], error: null }),
    classIds.length
      ? svc.from('schedule_slots').select('class_id').in('class_id', classIds)
      : Promise.resolve({ data: [], error: null }),
    classIds.length
      ? svc.from('assignments').select('class_id').in('class_id', classIds)
      : Promise.resolve({ data: [], error: null }),
    classIds.length
      ? svc.from('exam_class_assignments').select('class_id').in('class_id', classIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (teachersRes.error) return res.status(500).json({ error: teachersRes.error.message })
  if (lessonsRes.error) return res.status(500).json({ error: lessonsRes.error.message })
  if (schedulesRes.error) return res.status(500).json({ error: schedulesRes.error.message })
  if (assignmentsRes.error) return res.status(500).json({ error: assignmentsRes.error.message })
  if (examsRes.error) return res.status(500).json({ error: examsRes.error.message })

  const teacherById = Object.fromEntries((teachersRes.data || []).map((row) => [row.id, row.full_name]))
  const lessonCount = {}
  const scheduleCount = {}
  const assignmentCount = {}
  const examCount = {}
  for (const row of lessonsRes.data || []) lessonCount[row.class_id] = (lessonCount[row.class_id] || 0) + 1
  for (const row of schedulesRes.data || []) scheduleCount[row.class_id] = (scheduleCount[row.class_id] || 0) + 1
  for (const row of assignmentsRes.data || []) assignmentCount[row.class_id] = (assignmentCount[row.class_id] || 0) + 1
  for (const row of examsRes.data || []) examCount[row.class_id] = (examCount[row.class_id] || 0) + 1

  res.json({
    data: enrollments.map((row) => ({
      class_id: row.class_id,
      enrolled_at: row.enrolled_at,
      avg_score: row.avg_score != null ? Number(row.avg_score) : null,
      attendance_pct: row.attendance_pct != null ? Number(row.attendance_pct) : null,
      class_name: row.classes?.name || `Lớp #${row.class_id}`,
      class_code: row.classes?.code || '',
      subject: row.classes?.subject || '—',
      grade_label: row.classes?.grade_label || '—',
      schedule_summary: row.classes?.schedule_summary || '',
      teacher_name: teacherById[row.classes?.teacher_id] || '—',
      lesson_count: lessonCount[row.class_id] || 0,
      schedule_count: scheduleCount[row.class_id] || 0,
      assignment_count: assignmentCount[row.class_id] || 0,
      exam_count: examCount[row.class_id] || 0,
    })),
  })
})

/** GET /api/me/class-teacher-requests — yêu cầu đổi GV của học viên */
router.get('/class-teacher-requests', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) return res.status(503).json({ error: 'Máy chủ chưa cấp đủ để tải yêu cầu.' })
  const uid = req.authUser.id
  const { data: profile, error: pErr } = await svc.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên xem được yêu cầu này.' })
  }
  const { data: rows, error } = await svc
    .from('student_teacher_change_requests')
    .select(
      'id, student_id, class_id, status, student_note, admin_note, created_at, updated_at, resolved_at, resolved_by',
    )
    .eq('student_id', uid)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data: rows || [] })
})

/** POST /api/me/class-teacher-requests — gửi yêu cầu đổi giáo viên (đã ghi danh lớp) */
router.post('/class-teacher-requests', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) return res.status(503).json({ error: 'Máy chủ chưa cấp đủ để gửi yêu cầu.' })
  const uid = req.authUser.id
  const { class_id: rawClassId, student_note } = req.body || {}
  const classId = Number(rawClassId)
  if (!Number.isFinite(classId)) {
    return res.status(400).json({ error: 'class_id không hợp lệ' })
  }
  const { data: profile, error: pErr } = await svc.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên được gửi yêu cầu đổi giáo viên.' })
  }
  const { data: enr, error: eErr } = await svc
    .from('class_enrollments')
    .select('class_id')
    .eq('student_id', uid)
    .eq('class_id', classId)
    .maybeSingle()
  if (eErr) return res.status(500).json({ error: eErr.message })
  if (!enr) {
    return res.status(403).json({ error: 'Bạn chưa được ghi danh lớp này.' })
  }
  const note =
    typeof student_note === 'string' && student_note.trim() ? student_note.trim().slice(0, 2000) : null
  const { data, error } = await svc
    .from('student_teacher_change_requests')
    .insert({
      student_id: uid,
      class_id: classId,
      status: 'pending',
      student_note: note,
    })
    .select('id, class_id, status, student_note, created_at')
    .single()
  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Bạn đã có yêu cầu đang chờ xử lý cho lớp này.' })
    }
    return res.status(500).json({ error: error.message })
  }
  res.status(201).json({ data })
})

/** GET /api/me/payments — yêu cầu thanh toán của học viên hiện tại */
router.get('/payments', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) return res.status(503).json({ error: 'Máy chủ chưa cấu hình đủ để tải thanh toán.' })
  const uid = req.authUser.id
  const { data: profile, error: pErr } = await svc.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên xem được yêu cầu thanh toán của mình.' })
  }

  const { data: rows, error } = await svc
    .from('student_class_payments')
    .select('*')
    .eq('student_id', uid)
    .order('submitted_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })

  const classIds = [...new Set((rows || []).map((row) => row.class_id).filter((v) => Number.isFinite(Number(v))))]
  let classById = {}
  if (classIds.length) {
    const { data: clsRows, error: cErr } = await svc
      .from('classes')
      .select('id, name, code, subject, grade_label, schedule_summary, tuition_fee')
      .in('id', classIds)
    if (cErr) return res.status(500).json({ error: cErr.message })
    classById = Object.fromEntries((clsRows || []).map((row) => [row.id, row]))
  }

  res.json({
    data: (rows || []).map((row) => {
      const cls = classById[row.class_id]
      return {
        id: row.id,
        class_id: row.class_id,
        class_name: cls?.name || `Lớp #${row.class_id}`,
        class_code: cls?.code || '',
        class_subject: cls?.subject || '—',
        class_grade_label: cls?.grade_label || '—',
        schedule_summary: cls?.schedule_summary || '',
        payment_source: row.payment_source,
        payment_status: row.payment_status,
        amount: row.amount != null ? Number(row.amount) : cls?.tuition_fee != null ? Number(cls.tuition_fee) : null,
        note: row.note || '',
        admin_note: row.admin_note || '',
        submitted_at: row.submitted_at,
        confirmed_at: row.confirmed_at,
        enrolled_at: row.enrolled_at,
      }
    }),
  })
})

/** POST /api/me/payments — học viên tạo yêu cầu mua lớp bằng chính tài khoản đang đăng nhập */
router.post('/payments', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) return res.status(503).json({ error: 'Máy chủ chưa cấu hình đủ để tạo yêu cầu thanh toán.' })
  const uid = req.authUser.id
  const { class_id, payment_source, note, student_phone } = req.body || {}
  const classId = Number(class_id)
  if (!Number.isFinite(classId)) {
    return res.status(400).json({ error: 'class_id không hợp lệ' })
  }

  const { data: profile, error: pErr } = await svc
    .from('profiles')
    .select('id, role, full_name, email, phone')
    .eq('id', uid)
    .maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên được tạo yêu cầu thanh toán.' })
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

  const { data: existing, error: eErr } = await svc
    .from('student_class_payments')
    .select('id, payment_status')
    .eq('student_id', uid)
    .eq('class_id', classId)
    .in('payment_status', ['pending', 'paid'])
    .maybeSingle()
  if (eErr) return res.status(500).json({ error: eErr.message })
  if (existing) {
    return res.status(409).json({ error: 'Bạn đã có yêu cầu thanh toán đang xử lý hoặc đã được xác nhận cho lớp này.' })
  }

  let source = 'bank_transfer'
  try {
    source = normalizePaymentSource(payment_source)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const row = {
    student_id: uid,
    class_id: classId,
    student_name: profile.full_name,
    student_email: profile.email || null,
    student_phone:
      (typeof student_phone === 'string' && student_phone.trim()) || profile.phone || null,
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

/** GET /api/me/course-payments — thanh toán mua khóa học (catalog) */
router.get('/course-payments', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) return res.status(503).json({ error: 'Máy chủ chưa cấu hình đủ để tải thanh toán khóa học.' })
  const uid = req.authUser.id
  const { data: profile, error: pErr } = await svc.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên xem được yêu cầu thanh toán khóa học của mình.' })
  }

  const { data: rows, error } = await svc
    .from('student_course_payments')
    .select('*')
    .eq('student_id', uid)
    .order('submitted_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })

  const courseIds = [...new Set((rows || []).map((row) => row.course_id).filter((v) => Number.isFinite(Number(v))))]
  let courseById = {}
  if (courseIds.length) {
    const { data: crsRows, error: cErr } = await svc
      .from('courses')
      .select('id, title, list_price')
      .in('id', courseIds)
    if (cErr) return res.status(500).json({ error: cErr.message })
    courseById = Object.fromEntries((crsRows || []).map((row) => [row.id, row]))
  }

  res.json({
    data: (rows || []).map((row) => {
      const crs = courseById[row.course_id]
      return {
        id: row.id,
        course_id: row.course_id,
        course_title: crs?.title || `Khóa #${row.course_id}`,
        payment_source: row.payment_source,
        payment_status: row.payment_status,
        amount: row.amount != null ? Number(row.amount) : crs?.list_price != null ? Number(crs.list_price) : null,
        note: row.note || '',
        admin_note: row.admin_note || '',
        submitted_at: row.submitted_at,
        confirmed_at: row.confirmed_at,
      }
    }),
  })
})

/** POST /api/me/course-payments — học viên mua khóa học (theo giá niêm yết) */
router.post('/course-payments', async (req, res) => {
  const svc = createServiceClient()
  if (!svc) return res.status(503).json({ error: 'Máy chủ chưa cấu hình đủ để tạo thanh toán khóa học.' })
  const uid = req.authUser.id
  const { course_id, payment_source, note, student_phone } = req.body || {}
  const courseId = Number(course_id)
  if (!Number.isFinite(courseId)) {
    return res.status(400).json({ error: 'course_id không hợp lệ' })
  }

  const { data: profile, error: pErr } = await svc
    .from('profiles')
    .select('id, role, full_name, email, phone')
    .eq('id', uid)
    .maybeSingle()
  if (pErr) return res.status(500).json({ error: pErr.message })
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên được mua khóa học qua tài khoản này.' })
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
    return res.status(400).json({ error: 'Khóa học này chưa có giá niêm yết. Vui lòng liên hệ trung tâm.' })
  }

  const { data: existing, error: eErr } = await svc
    .from('student_course_payments')
    .select('id, payment_status')
    .eq('student_id', uid)
    .eq('course_id', courseId)
    .in('payment_status', ['pending', 'paid'])
    .maybeSingle()
  if (eErr) return res.status(500).json({ error: eErr.message })
  if (existing) {
    return res.status(409).json({ error: 'Bạn đã có yêu cầu hoặc đã thanh toán khóa học này.' })
  }

  let source = 'bank_transfer'
  try {
    source = normalizePaymentSource(payment_source)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const row = {
    student_id: uid,
    course_id: courseId,
    student_name: profile.full_name,
    student_email: profile.email || null,
    student_phone: (typeof student_phone === 'string' && student_phone.trim()) || profile.phone || null,
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

/** GET /api/me/exam-attempts */
router.get('/exam-attempts', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const { data, error } = await sb
    .from('exam_attempts')
    .select(
      'id, student_id, exam_id, score, max_score, correct_count, total_count, completed_at, exams ( title )',
    )
    .eq('student_id', uid)
    .order('completed_at', { ascending: false })
    .limit(limit)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/**
 * Đề kiểm tra: học viên đã ghi danh lớp; đề published;
 * nếu có exam_class_assignments thì phải trùng lớp; nếu không có bản ghi lớp nào thì dùng cờ assigned (kho cũ).
 */
async function assertStudentMayAccessExam(sb, uid, examId) {
  const { data: profile } = await sb.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (profile?.role !== 'student') return { ok: false, code: 'not_student' }
  const { data: enr } = await sb.from('class_enrollments').select('class_id').eq('student_id', uid)
  const classIds = new Set(
    (enr || []).map((r) => nid(r.class_id)).filter((n) => Number.isFinite(n)),
  )
  if (classIds.size === 0) return { ok: false, code: 'no_enrollment' }

  const eidNum = nid(examId)
  if (!Number.isFinite(eidNum)) return { ok: false, code: 'no_exam' }

  const { data: exam, error: exErr } = await sb
    .from('exams')
    .select('id, published, assigned')
    .eq('id', eidNum)
    .maybeSingle()
  if (exErr) return { ok: false, code: 'error', message: exErr.message }
  if (!exam?.published) return { ok: false, code: 'no_exam' }

  const { data: links, error: linkErr } = await sb
    .from('exam_class_assignments')
    .select('class_id')
    .eq('exam_id', eidNum)
  if (linkErr) return { ok: false, code: 'error', message: linkErr.message }

  if (links?.length) {
    const ok = links.some((l) => classIds.has(nid(l.class_id)))
    return ok ? { ok: true } : { ok: false, code: 'no_exam' }
  }
  if (!exam.assigned) return { ok: false, code: 'no_exam' }
  return { ok: true }
}

/**
 * POST /api/me/exam-attempts
 * body: { exam_id, score, max_score, correct_count?, total_count? }
 */
router.post('/exam-attempts', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { data: roleRow } = await sb.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (roleRow?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên được lưu kết quả bài kiểm tra' })
  }
  const { exam_id, score, max_score, correct_count, total_count } = req.body || {}
  const eid = Number(exam_id)
  const sc = Number(score)
  const mx = Number(max_score)
  if (!Number.isFinite(eid) || !Number.isFinite(sc) || !Number.isFinite(mx)) {
    return res.status(400).json({ error: 'exam_id, score, max_score phải là số hợp lệ' })
  }
  const examGate = await assertStudentMayAccessExam(sb, uid, eid)
  if (!examGate.ok) {
    if (examGate.code === 'not_student') {
      return res.status(403).json({ error: 'Chỉ học viên được lưu kết quả bài kiểm tra' })
    }
    if (examGate.code === 'no_enrollment') {
      return res.status(403).json({ error: 'Bạn chưa được ghi danh lớp nào.' })
    }
    if (examGate.code === 'no_exam') {
      return res.status(403).json({ error: 'Đề không tồn tại hoặc chưa được giao cho lớp.' })
    }
    return res.status(500).json({ error: examGate.message || 'Lỗi' })
  }
  const row = {
    student_id: uid,
    exam_id: eid,
    score: sc,
    max_score: mx,
    correct_count:
      correct_count !== undefined && correct_count !== null ? Number(correct_count) : null,
    total_count: total_count !== undefined && total_count !== null ? Number(total_count) : null,
  }
  const { data, error } = await sb.from('exam_attempts').insert(row).select('*').single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ data })
})

/** GET /api/me/exams — đề published; theo lớp (exam_class_assignments) hoặc kho assigned không gắn lớp.
 *  Query `class_id`: chỉ đề được gán cho lớp đó (học viên phải đã ghi danh lớp).
 */
router.get('/exams', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { data: profile } = await sb.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (profile?.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học viên được xem đề kiểm tra được giao.' })
  }
  const filterClassId =
    req.query.class_id != null && String(req.query.class_id).trim() !== ''
      ? nid(req.query.class_id)
      : null
  const { data: enr, error: eErr } = await sb.from('class_enrollments').select('class_id').eq('student_id', uid)
  if (eErr) return res.status(500).json({ error: eErr.message })
  if (!enr?.length) {
    return res.json({ data: [], meta: { needsEnrollment: true } })
  }
  const classIds = new Set(enr.map((r) => nid(r.class_id)).filter((n) => Number.isFinite(n)))
  if (Number.isFinite(filterClassId) && !classIds.has(filterClassId)) {
    return res.json({ data: [], meta: { needsEnrollment: false } })
  }
  const { data: allLinks, error: linkErr } = await sb.from('exam_class_assignments').select('exam_id, class_id')
  if (linkErr) return res.status(500).json({ error: linkErr.message })
  const examsWithLinks = new Set((allLinks || []).map((r) => nid(r.exam_id)).filter((n) => Number.isFinite(n)))
  const reachableExamIds = new Set(
    (allLinks || [])
      .filter((r) => classIds.has(nid(r.class_id)))
      .map((r) => nid(r.exam_id))
      .filter((n) => Number.isFinite(n)),
  )
  const reachableExamIdsForClass =
    Number.isFinite(filterClassId)
      ? new Set(
          (allLinks || [])
            .filter((r) => nid(r.class_id) === filterClassId)
            .map((r) => nid(r.exam_id))
            .filter((n) => Number.isFinite(n)),
        )
      : null
  const { data: examsRaw, error } = await sb
    .from('exams')
    .select('*')
    .eq('published', true)
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  const data = (examsRaw || []).filter((e) => {
    const eid = nid(e.id)
    if (!Number.isFinite(eid)) return false
    if (reachableExamIdsForClass) {
      if (!examsWithLinks.has(eid)) return false
      return reachableExamIdsForClass.has(eid)
    }
    if (examsWithLinks.has(eid)) return reachableExamIds.has(eid)
    return e.assigned === true
  })
  res.json({ data })
})

/** GET /api/me/exams/:id — chi tiết đề (câu hỏi / nhúng) khi đủ điều kiện */
router.get('/exams/:id', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id không hợp lệ' })
  const gate = await assertStudentMayAccessExam(sb, uid, id)
  if (!gate.ok) {
    if (gate.code === 'not_student') {
      return res.status(403).json({ error: 'Chỉ học viên được làm bài kiểm tra được giao.' })
    }
    if (gate.code === 'no_enrollment') {
      return res.status(403).json({ error: 'Bạn chưa được ghi danh lớp nào. Liên hệ trung tâm để được giao bài.' })
    }
    if (gate.code === 'no_exam') return res.status(404).json({ error: 'Không tìm thấy đề hoặc đề chưa được giao.' })
    return res.status(500).json({ error: gate.message || 'Lỗi' })
  }
  const { data, error } = await sb.from('exams').select('*').eq('id', id).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Không tìm thấy đề' })
  res.json({ data })
})

/** GET /api/me/course-progress */
router.get('/course-progress', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { data, error } = await sb
    .from('student_course_progress')
    .select(
      `
      student_id, course_id, progress_pct, note, updated_at,
      courses ( id, title, subject_id, visible )
    `,
    )
    .eq('student_id', uid)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** PATCH /api/me/course-progress/:courseId */
router.patch('/course-progress/:courseId', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const courseId = Number(req.params.courseId)
  if (!Number.isFinite(courseId)) return res.status(400).json({ error: 'courseId không hợp lệ' })
  const { progress_pct, note } = req.body || {}
  const patch = {}
  if (progress_pct !== undefined) {
    const p = Number(progress_pct)
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      return res.status(400).json({ error: 'progress_pct phải từ 0 đến 100' })
    }
    patch.progress_pct = p
  }
  if (note !== undefined) {
    patch.note = typeof note === 'string' ? note : null
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' })
  }
  const { data, error } = await sb
    .from('student_course_progress')
    .upsert(
      { student_id: uid, course_id: courseId, ...patch },
      { onConflict: 'student_id,course_id' },
    )
    .select('*')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/** GET /api/me/assignments — bài tập trong các lớp user được xem */
router.get('/assignments', async (req, res) => {
  const sb = req.supabaseUser
  const { data, error } = await sb
    .from('assignments')
    .select(
      `
      id, class_id, title, due_at, questions, submitted_count, total_students, created_at,
      classes ( id, name, code, subject, teacher_id )
    `,
    )
    .order('due_at', { ascending: true, nullsFirst: false })
  if (error) return res.status(500).json({ error: error.message })
  const mapped = (data || []).map((row) => ({
    ...row,
    questions: stripMcqAnswersForClient(row.questions),
  }))
  res.json({ data: mapped })
})

/** GET /api/me/assignment-submissions */
router.get('/assignment-submissions', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { data, error } = await sb
    .from('assignment_submissions')
    .select(
      `
      id, assignment_id, student_id, submitted_at, score, status, answers,
      assignments ( id, title, class_id, due_at )
    `,
    )
    .eq('student_id', uid)
    .order('submitted_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

/**
 * POST /api/me/assignment-submissions
 * body: { assignment_id, score?, status? }
 */
router.post('/assignment-submissions', async (req, res) => {
  const sb = req.supabaseUser
  const uid = req.authUser.id
  const { assignment_id, score, status, answers } = req.body || {}
  const aid = Number(assignment_id)
  if (!Number.isFinite(aid)) return res.status(400).json({ error: 'assignment_id không hợp lệ' })

  const { data: asg, error: aErr } = await sb
    .from('assignments')
    .select('id, questions')
    .eq('id', aid)
    .maybeSingle()
  if (aErr) return res.status(500).json({ error: aErr.message })
  if (!asg) return res.status(404).json({ error: 'Không tìm thấy bài tập' })

  const qs = Array.isArray(asg.questions) ? asg.questions : []
  const taking = normalizeMcqForTaking(qs)

  const row = {
    assignment_id: aid,
    student_id: uid,
    score: score !== undefined && score !== null ? Number(score) : null,
    status: typeof status === 'string' ? status : 'pending',
    answers: answers != null && typeof answers === 'object' ? answers : null,
  }

  if (taking.length > 0) {
    if (!allMcqSourceIndicesAnswered(taking, answers)) {
      return res.status(400).json({ error: 'Vui lòng trả lời đủ các câu hỏi trắc nghiệm' })
    }
    const graded = gradeMcqAttempt(qs, answers)
    row.score = graded.score
    row.status = 'graded'
    row.answers = answers
  }

  const { data, error } = await sb.from('assignment_submissions').insert(row).select('*').single()
  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Đã nộp bài cho bài tập này' })
    }
    return res.status(500).json({ error: error.message })
  }
  res.status(201).json({ data })
})

export default router
