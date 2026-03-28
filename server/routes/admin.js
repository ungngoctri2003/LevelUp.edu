import { Router } from 'express'
import { requireAdmin } from '../middleware/requireAdmin.js'
import * as adminApi from '../../src/services/adminApi.js'

const router = Router()
router.use(requireAdmin)

/** Trả JSON { data } cho GET (khác handler mutation { ok: true }). */
function jsonData(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req)
      res.json({ data })
    } catch (e) {
      res.status(400).json({ error: e?.message || 'Lỗi' })
    }
  }
}

router.get(
  '/students',
  jsonData(async (req) => adminApi.fetchStudentsAdmin(req.sbAdmin)),
)

router.get(
  '/teachers',
  jsonData(async (req) => adminApi.fetchTeachersAdmin(req.sbAdmin)),
)

router.get(
  '/exam-attempt-counts',
  jsonData(async (req) => adminApi.fetchAttemptCounts(req.sbAdmin)),
)

function actor(req) {
  return { id: req.authUser.id, email: req.authUser.email }
}

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req)
      res.json({ ok: true })
    } catch (e) {
      res.status(400).json({ error: e?.message || 'Lỗi thao tác' })
    }
  }
}

// --- Courses ---
router.post(
  '/courses',
  handle(async (req) => {
    const b = req.body || {}
    await adminApi.adminInsertCourse(req.sbAdmin, { ...b, user: actor(req) })
  }),
)

router.patch(
  '/courses/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID khóa học không hợp lệ')
    await adminApi.adminUpdateCourse(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/courses/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    const title = typeof req.query.title === 'string' ? req.query.title : ''
    if (!Number.isFinite(id)) throw new Error('ID khóa học không hợp lệ')
    await adminApi.adminDeleteCourse(req.sbAdmin, id, title, actor(req))
  }),
)

// --- Exams ---
router.post(
  '/exams',
  handle(async (req) => {
    await adminApi.adminInsertExam(req.sbAdmin, req.body || {}, actor(req))
  }),
)

router.patch(
  '/exams/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID đề không hợp lệ')
    await adminApi.adminUpdateExam(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/exams/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    const title = typeof req.query.title === 'string' ? req.query.title : ''
    if (!Number.isFinite(id)) throw new Error('ID đề không hợp lệ')
    await adminApi.adminDeleteExam(req.sbAdmin, id, title, actor(req))
  }),
)

// --- News ---
router.post(
  '/news',
  handle(async (req) => {
    await adminApi.adminInsertNews(req.sbAdmin, req.body || {}, actor(req))
  }),
)

router.patch(
  '/news/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID tin không hợp lệ')
    await adminApi.adminUpdateNews(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/news/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    const title = typeof req.query.title === 'string' ? req.query.title : ''
    if (!Number.isFinite(id)) throw new Error('ID tin không hợp lệ')
    await adminApi.adminDeleteNews(req.sbAdmin, id, title, actor(req))
  }),
)

// --- Admissions ---
router.post(
  '/admissions',
  handle(async (req) => {
    await adminApi.adminInsertAdmission(req.sbAdmin, req.body || {}, actor(req))
  }),
)

router.patch(
  '/admissions/:id/status',
  handle(async (req) => {
    const id = String(req.params.id)
    const status = (req.body || {}).status
    if (!status) throw new Error('Thiếu status')
    await adminApi.adminUpdateAdmissionStatus(req.sbAdmin, id, status, actor(req))
  }),
)

router.delete(
  '/admissions/:id',
  handle(async (req) => {
    await adminApi.adminDeleteAdmission(req.sbAdmin, req.params.id, actor(req))
  }),
)

// --- Students ---
router.patch(
  '/students/:profileId',
  handle(async (req) => {
    await adminApi.adminUpdateStudent(req.sbAdmin, req.params.profileId, req.body || {}, actor(req))
  }),
)

router.post(
  '/students/:profileId/toggle-learning',
  handle(async (req) => {
    const { makeLearningActive } = req.body || {}
    if (typeof makeLearningActive !== 'boolean') throw new Error('makeLearningActive phải là boolean')
    await adminApi.adminToggleStudentActive(req.sbAdmin, req.params.profileId, makeLearningActive, actor(req))
  }),
)

router.post(
  '/students/:profileId/account',
  handle(async (req) => {
    const { accountStatus } = req.body || {}
    if (!accountStatus) throw new Error('Thiếu accountStatus')
    await adminApi.adminSetStudentAccountStatus(req.sbAdmin, req.params.profileId, accountStatus, actor(req))
  }),
)

router.post(
  '/students/:profileId/student-profile-status',
  handle(async (req) => {
    const { status } = req.body || {}
    if (!status) throw new Error('Thiếu status')
    const { error } = await req.sbAdmin.from('student_profiles').update({ status }).eq('user_id', req.params.profileId)
    if (error) throw new Error(error.message)
    await adminApi.logAdminActivity(
      req.sbAdmin,
      `Cập nhật student_profiles.status (${status})`,
      'user',
      req.authUser.email,
      req.authUser.id,
    )
  }),
)

// --- Teachers ---
router.patch(
  '/teachers/:profileId',
  handle(async (req) => {
    await adminApi.adminUpdateTeacher(req.sbAdmin, req.params.profileId, req.body || {}, actor(req))
  }),
)

router.post(
  '/teachers/:profileId/approval',
  handle(async (req) => {
    const { approvalStatus } = req.body || {}
    if (!approvalStatus) throw new Error('Thiếu approvalStatus')
    await adminApi.adminSetTeacherApproval(req.sbAdmin, req.params.profileId, approvalStatus, actor(req))
  }),
)

// --- Dashboard settings ---
router.patch(
  '/settings/dashboard',
  handle(async (req) => {
    await adminApi.upsertAdminStats(req.sbAdmin, req.body || {}, actor(req))
  }),
)

// --- Activity log ---
router.post(
  '/activity',
  handle(async (req) => {
    const { action, type } = req.body || {}
    if (!action) throw new Error('Thiếu action')
    await adminApi.logAdminActivity(req.sbAdmin, action, type || 'admin', req.authUser.email, req.authUser.id)
  }),
)

export default router
