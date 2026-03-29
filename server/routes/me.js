import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  allMcqSourceIndicesAnswered,
  gradeMcqAttempt,
  normalizeMcqForTaking,
  stripMcqAnswersForClient,
} from '../../src/lib/mcqQuestions.js'

const router = Router()

router.use(requireAuth)

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

/** GET /api/me/classes */
router.get('/classes', async (req, res) => {
  const sb = req.supabaseUser
  const { data, error } = await sb
    .from('classes')
    .select(
      'id, code, name, subject, grade_label, schedule_summary, teacher_id, created_at, updated_at',
    )
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
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
