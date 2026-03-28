/** @param {import('@supabase/supabase-js').SupabaseClient} sb */

export async function loadTeacherBundle(sb) {
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
    }
  }
  const [enRes, slotRes, postRes, asgRes] = await Promise.all([
    sb.from('class_enrollments').select('*, profiles(full_name,email)').in('class_id', classIds),
    sb.from('schedule_slots').select('*').in('class_id', classIds),
    sb.from('teacher_lesson_posts').select('*').in('class_id', classIds).order('updated_at', { ascending: false }),
    sb.from('assignments').select('*').in('class_id', classIds).order('due_at', { ascending: true }),
  ])
  if (enRes.error) throw new Error(enRes.error.message)
  if (slotRes.error) throw new Error(slotRes.error.message)
  if (postRes.error) throw new Error(postRes.error.message)
  if (asgRes.error) throw new Error(asgRes.error.message)

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
  return (slots || []).map((s) => ({
    id: String(s.id),
    classId: String(s.class_id),
    className: classesById[s.class_id]?.name || `Lớp #${s.class_id}`,
    day: s.day_label,
    time: s.time_range,
    room: s.room || '—',
  }))
}
