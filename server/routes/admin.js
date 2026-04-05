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

router.get('/classes', jsonData(async (req) => adminApi.fetchClassesAdmin(req.sbAdmin)))

router.get(
  '/classes/:id/enrollments',
  jsonData(async (req) => adminApi.fetchClassEnrollmentsAdmin(req.sbAdmin, req.params.id)),
)

router.post('/classes', async (req, res) => {
  try {
    await adminApi.adminInsertClass(req.sbAdmin, req.body || {}, actor(req))
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Lỗi' })
  }
})

router.patch(
  '/classes/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID lớp không hợp lệ')
    await adminApi.adminUpdateClass(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/classes/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID lớp không hợp lệ')
    await adminApi.adminDeleteClass(req.sbAdmin, id, actor(req))
  }),
)

router.post('/classes/:id/enrollments', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID lớp không hợp lệ')
    const student_id = (req.body || {}).student_id
    await adminApi.adminAddClassEnrollment(req.sbAdmin, id, student_id, actor(req))
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Lỗi' })
  }
})

router.delete(
  '/classes/:id/enrollments/:studentId',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID lớp không hợp lệ')
    await adminApi.adminRemoveClassEnrollment(req.sbAdmin, id, req.params.studentId, actor(req))
  }),
)

router.post('/users/student', async (req, res) => {
  try {
    const data = await adminApi.adminProvisionStudent(req.sbAdmin, req.body || {}, actor(req))
    res.json({ ok: true, data })
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Lỗi' })
  }
})

router.post('/users/teacher', async (req, res) => {
  try {
    const data = await adminApi.adminProvisionTeacher(req.sbAdmin, req.body || {}, actor(req))
    res.json({ ok: true, data })
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Lỗi' })
  }
})

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

// --- Subjects ---
router.get('/subjects', jsonData(async (req) => adminApi.fetchSubjects(req.sbAdmin)))

router.post(
  '/subjects',
  handle(async (req) => {
    await adminApi.adminInsertSubject(req.sbAdmin, req.body || {}, actor(req))
  }),
)

router.patch(
  '/subjects/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID môn không hợp lệ')
    await adminApi.adminUpdateSubject(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/subjects/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    const name = typeof req.query.name === 'string' ? req.query.name : ''
    if (!Number.isFinite(id)) throw new Error('ID môn không hợp lệ')
    await adminApi.adminDeleteSubject(req.sbAdmin, id, name, actor(req))
  }),
)

// --- Lessons ---
router.get(
  '/lessons',
  jsonData(async (req) => adminApi.fetchLessonsAdmin(req.sbAdmin)),
)

router.get(
  '/lessons/:id/details',
  jsonData(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID bài giảng không hợp lệ')
    const row = await adminApi.fetchLessonDetailsRow(req.sbAdmin, id)
    return (
      row || {
        lesson_id: id,
        summary: '',
        teacher_name: '',
        youtube_url: null,
        outline: [],
        sections: [],
        resources: [],
        practice_hints: [],
      }
    )
  }),
)

router.post(
  '/lessons',
  handle(async (req) => {
    await adminApi.adminInsertLesson(req.sbAdmin, req.body || {}, actor(req))
  }),
)

router.patch(
  '/lessons/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID bài giảng không hợp lệ')
    await adminApi.adminUpdateLesson(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/lessons/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    const title = typeof req.query.title === 'string' ? req.query.title : ''
    if (!Number.isFinite(id)) throw new Error('ID bài giảng không hợp lệ')
    await adminApi.adminDeleteLesson(req.sbAdmin, id, title, actor(req))
  }),
)

router.put('/lessons/:id/details', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID bài giảng không hợp lệ')
    const data = await adminApi.adminUpsertLessonDetails(req.sbAdmin, id, req.body || {}, actor(req))
    res.json({ ok: true, data })
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Lỗi thao tác' })
  }
})

// --- Bài giảng trong lớp (teacher_lesson_posts) ---
router.get(
  '/teacher-lesson-posts',
  jsonData(async (req) => adminApi.fetchTeacherLessonPostsAdmin(req.sbAdmin)),
)

router.post(
  '/teacher-lesson-posts',
  handle(async (req) => {
    await adminApi.adminInsertTeacherLessonPost(req.sbAdmin, req.body || {}, actor(req))
  }),
)

router.get(
  '/teacher-lesson-posts/:id/details',
  jsonData(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID bài giảng lớp không hợp lệ')
    const post = await adminApi.fetchTeacherLessonPostMetaAdmin(req.sbAdmin, id)
    if (!post) throw new Error('Không tìm thấy bài giảng lớp')
    const row = await adminApi.fetchTeacherLessonPostDetailsRow(req.sbAdmin, id)
    const details =
      row ?? {
        post_id: id,
        summary: '',
        teacher_name: '',
        youtube_url: null,
        outline: [],
        sections: [],
        resources: [],
        practice_hints: [],
      }
    return { post, details }
  }),
)

router.put('/teacher-lesson-posts/:id/details', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID bài giảng lớp không hợp lệ')
    const data = await adminApi.adminUpsertTeacherLessonPostDetails(req.sbAdmin, id, req.body || {}, actor(req))
    res.json({ ok: true, data })
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Lỗi thao tác' })
  }
})

router.patch(
  '/teacher-lesson-posts/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID bài giảng lớp không hợp lệ')
    await adminApi.adminUpdateTeacherLessonPost(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/teacher-lesson-posts/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    const title = typeof req.query.title === 'string' ? req.query.title : ''
    if (!Number.isFinite(id)) throw new Error('ID bài giảng lớp không hợp lệ')
    await adminApi.adminDeleteTeacherLessonPost(req.sbAdmin, id, title, actor(req))
  }),
)

// --- Public teacher cards (landing) ---
router.get(
  '/public-teachers',
  jsonData(async (req) => adminApi.fetchPublicTeachersAdmin(req.sbAdmin)),
)

router.post(
  '/public-teachers',
  handle(async (req) => {
    await adminApi.adminInsertPublicTeacher(req.sbAdmin, req.body || {}, actor(req))
  }),
)

router.patch(
  '/public-teachers/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) throw new Error('ID không hợp lệ')
    await adminApi.adminUpdatePublicTeacher(req.sbAdmin, id, req.body || {}, actor(req))
  }),
)

router.delete(
  '/public-teachers/:id',
  handle(async (req) => {
    const id = Number(req.params.id)
    const name = typeof req.query.name === 'string' ? req.query.name : ''
    if (!Number.isFinite(id)) throw new Error('ID không hợp lệ')
    await adminApi.adminDeletePublicTeacher(req.sbAdmin, id, name, actor(req))
  }),
)

// --- Marketing leads ---
router.get('/marketing-leads', jsonData(async (req) => {
  const limit = Number(req.query.limit) || 200
  const offset = Number(req.query.offset) || 0
  return adminApi.fetchMarketingLeadsAdmin(req.sbAdmin, limit, offset)
}))

// --- CMS trang chủ ---
router.get('/cms-landing', jsonData(async (req) => adminApi.fetchCmsLandingAdmin(req.sbAdmin)))

router.patch(
  '/cms-landing',
  handle(async (req) => {
    await adminApi.upsertCmsLandingAdmin(req.sbAdmin, req.body || {}, actor(req))
  }),
)

export default router
