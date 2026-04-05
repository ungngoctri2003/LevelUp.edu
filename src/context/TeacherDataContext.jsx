import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { APP_DATA_LOAD_ERROR } from '../lib/publicUserMessages.js'
import { useAuthSession } from './AuthSessionContext.jsx'
import * as tq from '../services/teacherQueries.js'
import { deliveryModeForSupabase, formatTimeRange, weekdayLabelFromDate } from '../lib/teacherScheduleFormat.js'
import { questionBankDraftsFromStored, sanitizeMcqBankForDatabase } from '../lib/mcqQuestions.js'

function isoToDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function computeTeacherDashboardStats(classes, submissions, scheduleSlotCount) {
  const myClasses = classes.length
  const totalStudents = classes.reduce((acc, c) => acc + (Number(c.students) || 0), 0)
  const pendingGrading = submissions.filter((g) => g.status === 'pending').length
  const upcomingSessions = Number(scheduleSlotCount) || 0
  return { myClasses, totalStudents, pendingGrading, upcomingSessions }
}

const TeacherDataContext = createContext(null)

export function TeacherDataProvider({ children }) {
  const { user } = useAuthSession()
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const b = await tq.loadTeacherBundle(supabase)
      setBundle(b)
    } catch (e) {
      if (import.meta.env.DEV) console.error('[TeacherData]', e)
      setError(APP_DATA_LOAD_ERROR)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => {
    if (!bundle) {
      return {
        state: {
          classes: [],
          lessons: [],
          schedule: [],
          assignments: [],
          examClassLinks: [],
          examCatalog: [],
          gradingQueue: [],
          teacherStudents: [],
          rosters: {},
        },
        loading,
        error,
        refresh,
        computeTeacherDashboardStats: () => ({
          myClasses: 0,
          totalStudents: 0,
          pendingGrading: 0,
          upcomingSessions: 0,
        }),
        async createClass() {},
        async updateClass() {},
        async deleteClass() {},
        async addEnrollment() {},
        async removeEnrollment() {},
        async updateEnrollmentMetrics() {},
        async addScheduleSlot(_classIdStr, _payload) {},
        async updateScheduleSlot(_slotIdStr, _payload) {},
        async deleteScheduleSlot() {},
        async addLessonPost(_classIdStr, _title, _duration_display) {},
        async updateLessonPost(_postId, _title, _duration_display) {},
        async deleteLessonPost() {},
        async addAssignment() {},
        async updateAssignment() {},
        async deleteAssignment() {},
        async gradeSubmission() {},
        async reopenSubmission() {},
        async deleteSubmission() {},
        async assignExamToClass() {},
        async removeExamClassAssignment() {},
      }
    }

    const classesUi = tq.mapClassesUi(bundle.classes, bundle.enrollments)
    const classesById = Object.fromEntries(bundle.classes.map((c) => [c.id, c]))
    const schedule = tq.scheduleRows(bundle.slots, classesById)

    const rosters = {}
    for (const c of classesUi) {
      rosters[c.id] = tq.rosterForClass(c.id, bundle.enrollments).map((r) => ({
        ...r,
        name: r.name && r.name !== '—' ? r.name : `Học viên ${String(r.id).slice(0, 8)}…`,
      }))
    }

    const normDet = (p) => {
      const d = p.teacher_lesson_post_details
      if (d == null) return null
      return Array.isArray(d) ? d[0] ?? null : d
    }
    const lessons = (bundle.lessonPosts || []).map((p) => {
      const det = normDet(p)
      const fromSummary = det?.summary != null ? String(det.summary).trim() : ''
      const legacyBody = p.body != null ? String(p.body).trim() : ''
      const previewSource = fromSummary || legacyBody
      return {
        id: String(p.id),
        classId: String(p.class_id),
        className: classesById[p.class_id]?.name || `Lớp ${p.class_id}`,
        title: p.title,
        body: p.body != null ? String(p.body) : '',
        bodyPreview:
          previewSource.length > 0
            ? `${previewSource.slice(0, 100)}${previewSource.length > 100 ? '…' : ''}`
            : '—',
        duration: p.duration_display || '—',
        views: p.view_count ?? 0,
        updated: new Date(p.updated_at).toLocaleDateString('vi-VN'),
      }
    })

    const examClassLinks = (bundle.examClassAssignments || []).map((row) => ({
      examId: String(row.exam_id),
      classId: String(row.class_id),
      examTitle: row.exams?.title || `Đề #${row.exam_id}`,
      examSubject: row.exams?.subject_label || '',
      className: classesById[row.class_id]?.name || `Lớp ${row.class_id}`,
      contentMode: row.exams?.content_mode === 'embed' ? 'embed' : 'mcq',
      duration: row.exams?.duration_minutes,
      questionCount: row.exams?.question_count,
    }))

    const assignments = (bundle.assignments || []).map((a) => {
      const rawQ = Array.isArray(a.questions) ? a.questions : []
      const qBank = sanitizeMcqBankForDatabase(rawQ)
      return {
        id: String(a.id),
        classId: String(a.class_id),
        className: classesById[a.class_id]?.name || `Lớp ${a.class_id}`,
        title: a.title,
        due: a.due_at ? new Date(a.due_at).toLocaleString('vi-VN') : '—',
        dueInput: isoToDatetimeLocalValue(a.due_at),
        submitted: a.submitted_count ?? 0,
        total: a.total_students ?? 0,
        mcqCount: qBank.length,
        questionItems: questionBankDraftsFromStored(rawQ),
      }
    })

    const gradingQueue = (bundle.submissions || []).map((s) => ({
      id: String(s.id),
      assignmentId: String(s.assignment_id),
      studentName: s.profiles?.full_name || `Học viên ${String(s.student_id).slice(0, 8)}`,
      assignment: s.assignments?.title || 'Bài tập',
      submittedAt: new Date(s.submitted_at).toLocaleString('vi-VN'),
      status: s.status,
      score: s.score != null ? Number(s.score) : undefined,
      _raw: s,
    }))

    const studentMap = new Map()
    for (const e of bundle.enrollments) {
      const sid = e.student_id
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          id: sid,
          name: e.profiles?.full_name || `Học viên ${String(sid).slice(0, 8)}…`,
          email: e.profiles?.email || '—',
          classes: [],
        })
      }
      studentMap.get(sid).classes.push(classesById[e.class_id]?.name || `Lớp ${e.class_id}`)
    }
    const teacherStudents = [...studentMap.values()]

    const state = {
      classes: classesUi,
      lessons,
      schedule: schedule.map((r) => ({
        ...r,
        upcoming: true,
      })),
      assignments,
      examClassLinks,
      examCatalog: bundle.examCatalog || [],
      gradingQueue,
      teacherStudents,
      rosters,
    }

    const statsBase = computeTeacherDashboardStats(classesUi, bundle.submissions || [], schedule.length)

    return {
      state,
      loading,
      error,
      refresh,
      computeTeacherDashboardStats: () => statsBase,

      async createClass(row) {
        const { data: auth } = await supabase.auth.getUser()
        const uid = auth?.user?.id
        if (!uid) throw new Error('Chưa đăng nhập')
        const code = row.code?.trim() || null
        const { error: err } = await supabase.from('classes').insert({
          code,
          name: row.name.trim(),
          subject: row.subject.trim() || '—',
          grade_label: row.grade.trim() || '—',
          schedule_summary: row.schedule?.trim() || '—',
          teacher_id: uid,
        })
        if (err) throw new Error(err.message)
        await refresh()
      },

      async updateClass(classIdStr, row) {
        const id = Number(classIdStr)
        const { error: err } = await supabase
          .from('classes')
          .update({
            name: row.name.trim(),
            subject: row.subject.trim() || '—',
            grade_label: row.grade.trim() || '—',
            schedule_summary: row.schedule?.trim() || '—',
          })
          .eq('id', id)
        if (err) throw new Error(err.message)
        await refresh()
      },

      async deleteClass(classIdStr) {
        const id = Number(classIdStr)
        const { error: err } = await supabase.from('classes').delete().eq('id', id)
        if (err) throw new Error(err.message)
        await refresh()
      },

      async addEnrollment(classIdStr, studentId) {
        const cid = Number(classIdStr)
        const { error: err } = await supabase.from('class_enrollments').insert({
          class_id: cid,
          student_id: studentId,
        })
        if (err) throw new Error(err.message)
        await refresh()
      },

      async removeEnrollment(classIdStr, studentId) {
        const cid = Number(classIdStr)
        const { error: err } = await supabase
          .from('class_enrollments')
          .delete()
          .eq('class_id', cid)
          .eq('student_id', studentId)
        if (err) throw new Error(err.message)
        await refresh()
      },

      async updateEnrollmentMetrics(classIdStr, studentId, avgScore, attendancePct) {
        const cid = Number(classIdStr)
        const { error: err } = await supabase
          .from('class_enrollments')
          .update({
            avg_score: avgScore != null ? Number(avgScore) : null,
            attendance_pct: attendancePct != null ? Number(attendancePct) : null,
          })
          .eq('class_id', cid)
          .eq('student_id', studentId)
        if (err) throw new Error(err.message)
        await refresh()
      },

      async addScheduleSlot(classIdStr, payload) {
        const cid = Number(classIdStr)
        const { startsAtIso, endsAtIso, deliveryMode } = payload
        const start = new Date(startsAtIso)
        const end = new Date(endsAtIso)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          throw new Error('Ngày giờ không hợp lệ.')
        }
        if (end.getTime() <= start.getTime()) {
          throw new Error('Giờ kết thúc phải sau giờ bắt đầu.')
        }
        const mode = deliveryModeForSupabase(deliveryMode)
        const day_label = weekdayLabelFromDate(start)
        const time_range = formatTimeRange(start, end)
        const { error: err } = await supabase.from('schedule_slots').insert({
          class_id: cid,
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          delivery_mode: mode,
          day_label,
          time_range,
          room: null,
          room_note: null,
        })
        if (err) throw new Error(err.message)
        await refresh()
      },

      async updateScheduleSlot(slotIdStr, payload) {
        const id = Number(slotIdStr)
        const cid = Number(payload.classIdStr)
        const { startsAtIso, endsAtIso, deliveryMode } = payload
        const start = new Date(startsAtIso)
        const end = new Date(endsAtIso)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          throw new Error('Ngày giờ không hợp lệ.')
        }
        if (end.getTime() <= start.getTime()) {
          throw new Error('Giờ kết thúc phải sau giờ bắt đầu.')
        }
        const mode = deliveryModeForSupabase(deliveryMode)
        const day_label = weekdayLabelFromDate(start)
        const time_range = formatTimeRange(start, end)
        const { error: err } = await supabase
          .from('schedule_slots')
          .update({
            class_id: cid,
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            delivery_mode: mode,
            day_label,
            time_range,
            room: null,
            room_note: null,
          })
          .eq('id', id)
        if (err) throw new Error(err.message)
        await refresh()
      },

      async deleteScheduleSlot(slotId) {
        const { error: err } = await supabase.from('schedule_slots').delete().eq('id', Number(slotId))
        if (err) throw new Error(err.message)
        await refresh()
      },

      async addLessonPost(classIdStr, title, duration_display) {
        const cid = Number(classIdStr)
        const { data: ins, error: err } = await supabase
          .from('teacher_lesson_posts')
          .insert({
            class_id: cid,
            title: title.trim(),
            duration_display: duration_display || null,
          })
          .select('id')
          .single()
        if (err) throw new Error(err.message)
        if (ins?.id) {
          const { error: dErr } = await supabase.from('teacher_lesson_post_details').upsert(
            {
              post_id: ins.id,
              outline: [],
              sections: [],
              resources: [],
              practice_hints: [],
            },
            { onConflict: 'post_id' },
          )
          if (dErr) throw new Error(dErr.message)
        }
        await refresh()
      },

      async updateLessonPost(postId, title, duration_display) {
        const dur =
          duration_display != null && String(duration_display).trim() ? String(duration_display).trim() : null
        const { error: err } = await supabase
          .from('teacher_lesson_posts')
          .update({
            title: title.trim(),
            duration_display: dur,
          })
          .eq('id', Number(postId))
        if (err) throw new Error(err.message)
        await refresh()
      },

      async deleteLessonPost(postId) {
        const { error: err } = await supabase.from('teacher_lesson_posts').delete().eq('id', Number(postId))
        if (err) throw new Error(err.message)
        await refresh()
      },

      async addAssignment(classIdStr, title, dueAt, questionItems) {
        const cid = Number(classIdStr)
        const questions = sanitizeMcqBankForDatabase(Array.isArray(questionItems) ? questionItems : [])
        const { error: err } = await supabase.from('assignments').insert({
          class_id: cid,
          title: title.trim(),
          due_at: dueAt || null,
          questions,
        })
        if (err) throw new Error(err.message)
        await refresh()
      },

      async deleteAssignment(asgId) {
        const { error: err } = await supabase.from('assignments').delete().eq('id', Number(asgId))
        if (err) throw new Error(err.message)
        await refresh()
      },

      async updateAssignment(asgId, { title, dueAt, questionItems }) {
        const id = Number(asgId)
        const questions = sanitizeMcqBankForDatabase(Array.isArray(questionItems) ? questionItems : [])
        const { error: err } = await supabase
          .from('assignments')
          .update({
            title: title.trim(),
            due_at: dueAt || null,
            questions,
          })
          .eq('id', id)
        if (err) throw new Error(err.message)
        await refresh()
      },

      async gradeSubmission(submissionId, score, status = 'graded') {
        const { error: err } = await supabase
          .from('assignment_submissions')
          .update({
            score: score != null ? Number(score) : null,
            status,
          })
          .eq('id', Number(submissionId))
        if (err) throw new Error(err.message)
        await refresh()
      },

      async reopenSubmission(submissionId) {
        const { error: err } = await supabase
          .from('assignment_submissions')
          .update({ status: 'pending', score: null })
          .eq('id', Number(submissionId))
        if (err) throw new Error(err.message)
        await refresh()
      },

      async deleteSubmission(submissionId) {
        const { error: err } = await supabase.from('assignment_submissions').delete().eq('id', Number(submissionId))
        if (err) throw new Error(err.message)
        await refresh()
      },

      async assignExamToClass(examIdStr, classIdStr) {
        const exam_id = Number(examIdStr)
        const class_id = Number(classIdStr)
        if (!Number.isFinite(exam_id) || !Number.isFinite(class_id)) throw new Error('Thiếu đề hoặc lớp')
        const { error: err } = await supabase.from('exam_class_assignments').insert({ exam_id, class_id })
        if (err) throw new Error(err.message)
        await refresh()
      },

      async removeExamClassAssignment(examIdStr, classIdStr) {
        const { error: err } = await supabase
          .from('exam_class_assignments')
          .delete()
          .eq('exam_id', Number(examIdStr))
          .eq('class_id', Number(classIdStr))
        if (err) throw new Error(err.message)
        await refresh()
      },
    }
  }, [bundle, loading, error, refresh])

  return <TeacherDataContext.Provider value={value}>{children}</TeacherDataContext.Provider>
}

export function useTeacherData() {
  const c = useContext(TeacherDataContext)
  if (!c) throw new Error('useTeacherData trong TeacherDataProvider')
  return c
}
