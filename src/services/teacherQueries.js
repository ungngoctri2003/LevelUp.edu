/** @param {import('@supabase/supabase-js').SupabaseClient} sb */

import {
  weekdayLabelFromDate,
  formatTimeRange,
  deliveryModeLabel,
  normalizeDeliveryMode,
  parseTimeStartMinutes,
  daySortKey,
} from '../lib/teacherScheduleFormat.js'

export async function loadTeacherBundle(sb) {
  const { data: examCatalog, error: examCatErr } = await sb
    .from('exams')
    .select('id, title, subject_label, level_label, duration_minutes, question_count, content_mode')
    .eq('published', true)
    .order('id', { ascending: true })
  if (examCatErr) throw new Error(examCatErr.message)

  const { data: classes, error: cErr } = await sb.from('classes').select('*').order('id')
  if (cErr) throw new Error(cErr.message)
  const cls = classes || []
  const classIds = cls.map((c) => c.id)
  if (classIds.length === 0) {
    return {
      classes: [],
      enrollments: [],
      slots: [],
      lessonPosts: [],
      assignments: [],
      submissions: [],
      examClassAssignments: [],
      examCatalog: examCatalog || [],
    }
  }
  const [enRes, slotRes, postRes, asgRes, ecxRes] = await Promise.all([
    sb.from('class_enrollments').select('*, profiles(full_name,email)').in('class_id', classIds),
    sb.from('schedule_slots').select('*').in('class_id', classIds),
    sb
      .from('teacher_lesson_posts')
      .select(
        '*, teacher_lesson_post_details ( summary, teacher_name, youtube_url, outline, sections, practice_hints )',
      )
      .in('class_id', classIds)
      .order('updated_at', { ascending: false }),
    sb.from('assignments').select('*').in('class_id', classIds).order('due_at', { ascending: true }),
    sb
      .from('exam_class_assignments')
      .select('exam_id, class_id, exams(id,title,subject_label,level_label,duration_minutes,question_count,content_mode)')
      .in('class_id', classIds),
  ])
  if (enRes.error) throw new Error(enRes.error.message)
  if (slotRes.error) throw new Error(slotRes.error.message)
  if (postRes.error) throw new Error(postRes.error.message)
  if (asgRes.error) throw new Error(asgRes.error.message)
  if (ecxRes.error) throw new Error(ecxRes.error.message)

  const assignments = asgRes.data || []
  const asgIds = assignments.map((a) => a.id)
  let submissions = []
  if (asgIds.length) {
    const subRes = await sb
      .from('assignment_submissions')
      .select('*, assignments(id,title,class_id), profiles(full_name,email)')
      .in('assignment_id', asgIds)
      .order('submitted_at', { ascending: false })
    if (subRes.error) throw new Error(subRes.error.message)
    submissions = subRes.data || []
  }

  return {
    classes: cls,
    enrollments: enRes.data || [],
    slots: slotRes.data || [],
    lessonPosts: postRes.data || [],
    assignments,
    submissions,
    examClassAssignments: ecxRes.data || [],
    examCatalog: examCatalog || [],
  }
}

export function mapClassesUi(cls, enrollments) {
  const countBy = {}
  for (const e of enrollments) {
    countBy[e.class_id] = (countBy[e.class_id] || 0) + 1
  }
  return cls.map((c) => ({
    id: String(c.id),
    name: c.name,
    subject: c.subject,
    grade: c.grade_label,
    students: countBy[c.id] || 0,
    schedule: c.schedule_summary || '—',
    _raw: c,
  }))
}

export function rosterForClass(classIdStr, enrollments) {
  const cid = Number(classIdStr)
  return enrollments
    .filter((e) => e.class_id === cid)
    .map((e) => ({
      id: e.student_id,
      name: e.profiles?.full_name || '—',
      email: e.profiles?.email || '—',
      avgScore: e.avg_score != null ? Number(e.avg_score) : 0,
      attendance: e.attendance_pct != null ? `${e.attendance_pct}%` : '—',
    }))
}

export function scheduleRows(slots, classesById) {
  return (slots || []).map((s) => {
    const c = classesById[s.class_id]
    const start = s.starts_at ? new Date(s.starts_at) : null
    const end = s.ends_at ? new Date(s.ends_at) : null
    const hasStart = start && !Number.isNaN(start.getTime())

    let day
    let time
    let sortTimestamp
    if (hasStart) {
      day = weekdayLabelFromDate(start)
      const endOk = end && !Number.isNaN(end.getTime()) ? end : null
      time = formatTimeRange(start, endOk)
      sortTimestamp = start.getTime()
    } else {
      day = s.day_label || '—'
      time = s.time_range || '—'
      sortTimestamp = daySortKey(day) * 86400000 + parseTimeStartMinutes(time) * 60000
    }

    const mode = normalizeDeliveryMode(s.delivery_mode)
    let locationLabel = deliveryModeLabel(mode)
    if (!hasStart && s.room != null && String(s.room).trim()) {
      locationLabel = String(s.room).trim()
    }

    return {
      id: String(s.id),
      classId: String(s.class_id),
      className: c?.name || `Lớp #${s.class_id}`,
      subject: c?.subject || '—',
      grade: c?.grade_label || '—',
      day,
      time,
      startsAt: s.starts_at || null,
      endsAt: s.ends_at || null,
      deliveryMode: mode,
      locationLabel,
      sortTimestamp,
      legacy: !hasStart,
    }
  })
}
