import { sanitizeMcqBankForDatabase } from '../lib/mcqQuestions.js'
import { assertValidEmbedSrc } from '../lib/examEmbed.js'

/** @param {import('@supabase/supabase-js').SupabaseClient} sb */

function viDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('vi-VN')
  } catch {
    return ''
  }
}

export async function logAdminActivity(sb, action, type = 'admin', actorEmail = null, actorUserId = null) {
  const { error } = await sb.from('admin_activity_logs').insert({
    action,
    type,
    actor_email: actorEmail,
    actor_user_id: actorUserId,
  })
  if (error && typeof console !== 'undefined' && console.warn) {
    console.warn('[admin log]', error.message)
  }
}

export async function fetchSubjects(sb) {
  const { data, error } = await sb.from('subjects').select('*').order('sort_order')
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchCoursesAdmin(sb) {
  const { data, error } = await sb
    .from('courses')
    .select('*, subjects(id, name, slug)')
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data || []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    subject: c.subjects?.name || '—',
    subject_id: c.subject_id,
    visible: c.visible !== false,
    sort_order: c.sort_order,
  }))
}

export async function fetchExamsAdmin(sb) {
  const { data, error } = await sb.from('exams').select('*').order('id')
  if (error) throw new Error(error.message)
  return (data || []).map((e) => ({
    id: e.id,
    title: e.title,
    subject: e.subject_label,
    duration: e.duration_minutes,
    questions: e.question_count,
    questionItems: Array.isArray(e.questions) ? e.questions : [],
    level: e.level_label || '',
    assigned: !!e.assigned,
    published: e.published !== false,
    contentMode: e.content_mode === 'embed' ? 'embed' : 'mcq',
    embedSrc: typeof e.embed_src === 'string' ? e.embed_src : '',
  }))
}

export async function fetchNewsAdmin(sb) {
  const { data, error } = await sb.from('news_posts').select('*').order('published_on', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((n) => ({
    id: n.id,
    title: n.title,
    date: viDate(n.published_on),
    excerpt: n.excerpt || '',
    body: n.body || '',
    category: n.category || 'Tin tức',
    slug: n.slug,
    published_on: n.published_on,
  }))
}

export async function fetchAdmissionsAdmin(sb) {
  const { data, error } = await sb.from('admission_applications').select('*').order('submitted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((r) => ({
    id: String(r.id),
    studentName: r.student_name,
    parentPhone: r.parent_phone,
    grade: r.grade_label,
    status: r.status,
    submitted: viDate(r.submitted_at),
    notes: r.notes,
  }))
}

export async function fetchActivityAdmin(sb) {
  const { data, error } = await sb
    .from('admin_activity_logs')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(40)
  if (error) throw new Error(error.message)
  return (data || []).map((a) => ({
    id: a.id,
    time: new Date(a.occurred_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    user: a.actor_email || '—',
    action: a.action,
    type: a.type,
  }))
}

export async function fetchAttemptCounts(sb) {
  const { data, error } = await sb.from('exam_attempts').select('student_id')
  if (error) throw new Error(error.message)
  const map = {}
  for (const row of data || []) {
    map[row.student_id] = (map[row.student_id] || 0) + 1
  }
  return map
}

export async function fetchStudentsAdmin(sb) {
  const { data, error } = await sb
    .from('profiles')
    .select('*, student_profiles(*)')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((p) => {
    const sp = p.student_profiles
    return {
      id: p.id,
      name: p.full_name,
      email: p.email,
      phone: p.phone || '',
      grade: sp?.grade_label || '—',
      status: sp?.status || 'active',
      joined: sp?.joined_at ? viDate(sp.joined_at) : viDate(p.created_at),
      source: sp?.source || 'registered',
      account_status: p.account_status,
    }
  })
}

export async function fetchTeachersAdmin(sb) {
  const [{ data, error }, { data: classRows, error: cErr }] = await Promise.all([
    sb
      .from('profiles')
      .select('*, teacher_profiles(*)')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false }),
    sb.from('classes').select('teacher_id'),
  ])
  if (error) throw new Error(error.message)
  if (cErr) throw new Error(cErr.message)
  const countByTeacher = {}
  for (const r of classRows || []) {
    countByTeacher[r.teacher_id] = (countByTeacher[r.teacher_id] || 0) + 1
  }
  return (data || []).map((p) => {
    const tp = p.teacher_profiles
    return {
      id: p.id,
      name: p.full_name,
      email: p.email,
      subjects: tp?.subjects_summary || '—',
      classes: countByTeacher[p.id] ?? 0,
      status: tp?.approval_status || 'pending',
      account_status: p.account_status,
    }
  })
}

/** Đồng bộ teacher_profiles.class_count_cache theo số lớp thực tế. */
export async function recomputeTeacherClassCount(sb, teacherUserId) {
  const { count, error } = await sb
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacherUserId)
  if (error) throw new Error(error.message)
  const n = count ?? 0
  const { error: u } = await sb.from('teacher_profiles').update({ class_count_cache: n }).eq('user_id', teacherUserId)
  if (u) throw new Error(u.message)
}

async function recomputeTeacherClassCounts(sb, teacherUserIds) {
  const ids = [...new Set((teacherUserIds || []).filter(Boolean))]
  for (const id of ids) {
    await recomputeTeacherClassCount(sb, id)
  }
}

/** Danh sách lớp học (bảng classes) — dùng trong admin. */
export async function fetchClassesAdmin(sb) {
  const { data: rows, error } = await sb.from('classes').select('*').order('id')
  if (error) throw new Error(error.message)
  const classes = rows || []
  const teacherIds = [...new Set(classes.map((c) => c.teacher_id))]
  let nameById = {}
  if (teacherIds.length) {
    const { data: profs, error: pErr } = await sb.from('profiles').select('id, full_name').in('id', teacherIds)
    if (pErr) throw new Error(pErr.message)
    nameById = Object.fromEntries((profs || []).map((p) => [p.id, p.full_name]))
  }
  const cids = classes.map((c) => c.id)
  const enrollCount = {}
  if (cids.length) {
    const { data: ens, error: eErr } = await sb.from('class_enrollments').select('class_id').in('class_id', cids)
    if (eErr) throw new Error(eErr.message)
    for (const e of ens || []) {
      enrollCount[e.class_id] = (enrollCount[e.class_id] || 0) + 1
    }
  }
  return classes.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    subject: c.subject,
    grade_label: c.grade_label,
    schedule_summary: c.schedule_summary || '',
    teacher_id: c.teacher_id,
    teacher_name: nameById[c.teacher_id] || '—',
    student_count: enrollCount[c.id] || 0,
  }))
}

export async function fetchClassEnrollmentsAdmin(sb, classId) {
  const id = Number(classId)
  if (!Number.isFinite(id)) throw new Error('ID lớp không hợp lệ')
  const { data: rows, error } = await sb
    .from('class_enrollments')
    .select('student_id, enrolled_at, avg_score, attendance_pct')
    .eq('class_id', id)
    .order('enrolled_at', { ascending: true })
  if (error) throw new Error(error.message)
  const ids = [...new Set((rows || []).map((r) => r.student_id))]
  const nameById = {}
  const emailById = {}
  if (ids.length) {
    const { data: profs, error: pe } = await sb.from('profiles').select('id, full_name, email').in('id', ids)
    if (pe) throw new Error(pe.message)
    for (const p of profs || []) {
      nameById[p.id] = p.full_name
      emailById[p.id] = p.email
    }
  }
  return (rows || []).map((e) => ({
    student_id: e.student_id,
    name: nameById[e.student_id] || '—',
    email: emailById[e.student_id] || '—',
    enrolled_at: e.enrolled_at,
    avg_score: e.avg_score != null ? Number(e.avg_score) : null,
    attendance_pct: e.attendance_pct != null ? Number(e.attendance_pct) : null,
  }))
}

export async function adminInsertClass(
  sb,
  { teacher_id, name, subject, grade_label, schedule_summary, code },
  user,
) {
  const tid = String(teacher_id || '').trim()
  const nm = String(name || '').trim()
  if (!tid || !nm) throw new Error('Thiếu giáo viên phụ trách hoặc tên lớp')
  const { data: prof, error: pe } = await sb.from('profiles').select('id, role').eq('id', tid).maybeSingle()
  if (pe) throw new Error(pe.message)
  if (!prof || prof.role !== 'teacher') throw new Error('profile_id không phải giáo viên')
  const row = {
    teacher_id: tid,
    name: nm,
    subject: String(subject || '').trim() || '—',
    grade_label: String(grade_label || '').trim() || '—',
    schedule_summary: schedule_summary != null && String(schedule_summary).trim() ? String(schedule_summary).trim() : null,
    code: code != null && String(code).trim() ? String(code).trim() : null,
  }
  const { error } = await sb.from('classes').insert(row)
  if (error) throw new Error(error.message)
  await recomputeTeacherClassCount(sb, tid)
  await logAdminActivity(sb, `Tạo lớp: ${nm} (GV ${tid.slice(0, 8)}…)`, 'admin', user?.email, user?.id)
}

export async function adminUpdateClass(sb, classId, patch, user) {
  const id = Number(classId)
  if (!Number.isFinite(id)) throw new Error('ID lớp không hợp lệ')
  const { data: cur, error: gErr } = await sb.from('classes').select('teacher_id, name').eq('id', id).maybeSingle()
  if (gErr) throw new Error(gErr.message)
  if (!cur) throw new Error('Không thấy lớp')
  const body = {}
  if (patch.name != null) body.name = String(patch.name).trim()
  if (patch.subject != null) body.subject = String(patch.subject).trim() || '—'
  if (patch.grade_label != null) body.grade_label = String(patch.grade_label).trim() || '—'
  if (patch.schedule_summary !== undefined) {
    body.schedule_summary =
      patch.schedule_summary != null && String(patch.schedule_summary).trim()
        ? String(patch.schedule_summary).trim()
        : null
  }
  if (patch.code !== undefined) {
    body.code = patch.code != null && String(patch.code).trim() ? String(patch.code).trim() : null
  }
  let newTeacherId = null
  if (patch.teacher_id != null) {
    const tid = String(patch.teacher_id).trim()
    const { data: prof, error: pe } = await sb.from('profiles').select('id, role').eq('id', tid).maybeSingle()
    if (pe) throw new Error(pe.message)
    if (!prof || prof.role !== 'teacher') throw new Error('Giáo viên phụ trách không hợp lệ')
    body.teacher_id = tid
    newTeacherId = tid
  }
  if (Object.keys(body).length === 0) throw new Error('Không có trường cập nhật')
  const { error } = await sb.from('classes').update(body).eq('id', id)
  if (error) throw new Error(error.message)
  const toRecompute = [cur.teacher_id]
  if (newTeacherId && newTeacherId !== cur.teacher_id) toRecompute.push(newTeacherId)
  await recomputeTeacherClassCounts(sb, toRecompute)
  await logAdminActivity(sb, `Cập nhật lớp #${id} (${cur.name})`, 'admin', user?.email, user?.id)
}

export async function adminDeleteClass(sb, classId, user) {
  const id = Number(classId)
  if (!Number.isFinite(id)) throw new Error('ID lớp không hợp lệ')
  const { data: cur, error: gErr } = await sb.from('classes').select('teacher_id, name').eq('id', id).maybeSingle()
  if (gErr) throw new Error(gErr.message)
  if (!cur) throw new Error('Không thấy lớp')
  const { error } = await sb.from('classes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await recomputeTeacherClassCount(sb, cur.teacher_id)
  await logAdminActivity(sb, `Xóa lớp: ${cur.name} (#${id})`, 'admin', user?.email, user?.id)
}

export async function adminAddClassEnrollment(sb, classId, studentId, user) {
  const cid = Number(classId)
  const sid = String(studentId || '').trim()
  if (!Number.isFinite(cid) || !sid) throw new Error('Thiếu lớp hoặc học viên')
  const { data: st, error: se } = await sb.from('profiles').select('id, role').eq('id', sid).maybeSingle()
  if (se) throw new Error(se.message)
  if (!st || st.role !== 'student') throw new Error('Chỉ thêm học viên (role student)')
  const { error } = await sb.from('class_enrollments').insert({ class_id: cid, student_id: sid })
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Thêm học viên vào lớp #${cid}`, 'user', user?.email, user?.id)
}

export async function adminRemoveClassEnrollment(sb, classId, studentId, user) {
  const cid = Number(classId)
  const sid = String(studentId || '').trim()
  if (!Number.isFinite(cid) || !sid) throw new Error('Thiếu lớp hoặc học viên')
  const { error } = await sb.from('class_enrollments').delete().eq('class_id', cid).eq('student_id', sid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Gỡ học viên khỏi lớp #${cid}`, 'user', user?.email, user?.id)
}

export async function fetchAdminSettings(sb) {
  const { data, error } = await sb.from('system_settings').select('key, value').eq('key', 'admin_stats_snapshot')
  if (error) throw new Error(error.message)
  const row = data?.[0]
  const v = row?.value || {}
  return {
    monthlyRevenue: Number(v.monthlyRevenue) || 0,
    openTickets: Number(v.openTickets) || 0,
  }
}

export async function upsertAdminStats(sb, partial, user) {
  const { data: cur } = await sb.from('system_settings').select('value').eq('key', 'admin_stats_snapshot').maybeSingle()
  const next = { ...(cur?.value || {}), ...partial }
  const { error } = await sb.from('system_settings').upsert({ key: 'admin_stats_snapshot', value: next })
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, 'Cập nhật chỉ số tổng quan (system_settings)', 'system', user?.email, user?.id)
}

function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export async function adminInsertCourse(sb, { title, description, subject_id, user }) {
  const { data, error } = await sb
    .from('courses')
    .insert({
      title: title.trim(),
      description: description?.trim() || '',
      subject_id,
      visible: true,
      sort_order: 0,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Thêm khóa học: ${title}`, 'course', user?.email, user?.id)
  return data
}

export async function adminUpdateCourse(sb, id, patch, user) {
  const body = {}
  if (patch.title != null) body.title = String(patch.title).trim()
  if (patch.description != null) body.description = String(patch.description).trim()
  if (patch.subject_id != null) body.subject_id = patch.subject_id
  if (patch.visible != null) body.visible = patch.visible
  const { error } = await sb.from('courses').update(body).eq('id', id)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Cập nhật khóa học #${id}`, 'course', user?.email, user?.id)
}

export async function adminDeleteCourse(sb, id, title, user) {
  const { error } = await sb.from('courses').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Xóa khóa: ${title}`, 'course', user?.email, user?.id)
}

export async function adminInsertExam(sb, row, user) {
  const mode = row.contentMode === 'embed' || row.content_mode === 'embed' ? 'embed' : 'mcq'
  let question_count = 0
  let questions = []
  let embed_src = null

  if (mode === 'embed') {
    const raw = row.embedSrc ?? row.embed_src
    embed_src = assertValidEmbedSrc(raw)
  } else if (Array.isArray(row.questionItems)) {
    questions = sanitizeMcqBankForDatabase(row.questionItems)
    question_count = questions.length
  } else {
    question_count = Number(row.questions) || 0
    questions = []
  }

  const { error } = await sb.from('exams').insert({
    title: row.title.trim(),
    subject_label: row.subject?.trim() || 'Môn học',
    duration_minutes: Number(row.duration) || 45,
    question_count,
    questions,
    level_label: row.level || null,
    assigned: !!row.assigned,
    published: row.published !== false,
    content_mode: mode,
    embed_src: mode === 'embed' ? embed_src : null,
  })
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Tạo đề: ${row.title}`, 'course', user?.email, user?.id)
}

export async function adminUpdateExam(sb, id, row, user) {
  const mode = row.contentMode === 'embed' || row.content_mode === 'embed' ? 'embed' : 'mcq'
  const body = {
    title: row.title.trim(),
    subject_label: row.subject?.trim() || 'Môn học',
    duration_minutes: Number(row.duration) || 45,
    level_label: row.level || null,
    assigned: !!row.assigned,
    published: row.published !== false,
    content_mode: mode,
  }
  if (mode === 'embed') {
    const raw = row.embedSrc ?? row.embed_src
    body.embed_src = assertValidEmbedSrc(raw)
    body.questions = []
    body.question_count = 0
  } else {
    body.embed_src = null
    if (Array.isArray(row.questionItems)) {
      const sanitized = sanitizeMcqBankForDatabase(row.questionItems)
      body.questions = sanitized
      body.question_count = sanitized.length
    } else {
      body.question_count = Number(row.questions) || 0
    }
  }
  const { error } = await sb.from('exams').update(body).eq('id', id)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Sửa đề #${id}`, 'course', user?.email, user?.id)
}

export async function adminDeleteExam(sb, id, title, user) {
  const { error } = await sb.from('exams').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Xóa đề: ${title}`, 'course', user?.email, user?.id)
}

export async function adminInsertNews(sb, { title, category, excerpt, user }) {
  const slug = slugify(title) + '-' + Date.now().toString(36)
  const { error } = await sb.from('news_posts').insert({
    title: title.trim(),
    category: category || 'Thông báo',
    excerpt: excerpt?.trim() || '',
    body: excerpt?.trim() || '',
    slug,
    published_on: new Date().toISOString().slice(0, 10),
  })
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Đăng tin: ${title}`, 'admin', user?.email, user?.id)
}

export async function adminUpdateNews(sb, id, { title, category, excerpt, body }, user) {
  const { error } = await sb
    .from('news_posts')
    .update({
      title: title.trim(),
      category,
      excerpt: excerpt?.trim() || '',
      body: body != null ? body : undefined,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Sửa tin #${id}`, 'admin', user?.email, user?.id)
}

export async function adminDeleteNews(sb, id, title, user) {
  const { error } = await sb.from('news_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Xóa tin: ${title}`, 'admin', user?.email, user?.id)
}

export async function adminInsertAdmission(sb, row, user) {
  const { error } = await sb.from('admission_applications').insert({
    student_name: row.studentName.trim(),
    parent_phone: row.parentPhone.trim() || '—',
    grade_label: row.grade.trim() || '—',
    status: row.status || 'new',
  })
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Thêm hồ sơ tuyển sinh: ${row.studentName}`, 'admin', user?.email, user?.id)
}

export async function adminUpdateAdmissionStatus(sb, id, status, user) {
  const nid = Number(id)
  const { error } = await sb.from('admission_applications').update({ status }).eq('id', nid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Cập nhật hồ sơ tuyển sinh #${nid}`, 'admin', user?.email, user?.id)
}

export async function adminDeleteAdmission(sb, id, user) {
  const nid = Number(id)
  const { error } = await sb.from('admission_applications').delete().eq('id', nid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Xóa hồ sơ tuyển sinh #${id}`, 'admin', user?.email, user?.id)
}

export async function adminUpdateStudent(sb, profileId, { name, email, phone, grade, status }, user) {
  const { error: e1 } = await sb
    .from('profiles')
    .update({ full_name: name.trim(), email: email.trim(), phone: phone?.trim() || null })
    .eq('id', profileId)
  if (e1) throw new Error(e1.message)
  const { error: e2 } = await sb
    .from('student_profiles')
    .update({
      grade_label: grade?.trim() || null,
      status: status || 'active',
    })
    .eq('user_id', profileId)
  if (e2) throw new Error(e2.message)
  await logAdminActivity(sb, `Cập nhật học viên ${email}`, 'user', user?.email, user?.id)
}

export async function adminToggleStudentActive(sb, profileId, makeLearningActive, user) {
  const acc = makeLearningActive ? 'active' : 'inactive'
  const st = makeLearningActive ? 'active' : 'inactive'
  const { error: e1 } = await sb.from('profiles').update({ account_status: acc }).eq('id', profileId)
  if (e1) throw new Error(e1.message)
  const { error: e2 } = await sb.from('student_profiles').update({ status: st }).eq('user_id', profileId)
  if (e2) throw new Error(e2.message)
  await logAdminActivity(sb, `${makeLearningActive ? 'Mở' : 'Khóa'} tài khoản học viên`, 'user', user?.email, user?.id)
}

export async function adminSetStudentAccountStatus(sb, profileId, account_status, user) {
  const { error } = await sb.from('profiles').update({ account_status }).eq('id', profileId)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Trạng thái tài khoản học viên: ${account_status}`, 'user', user?.email, user?.id)
}

export async function adminUpdateTeacher(sb, profileId, { name, email, subjects, status }, user) {
  const { error: e1 } = await sb
    .from('profiles')
    .update({ full_name: name.trim(), email: email.trim() })
    .eq('id', profileId)
  if (e1) throw new Error(e1.message)
  const { error: e2 } = await sb
    .from('teacher_profiles')
    .update({
      subjects_summary: subjects?.trim() || null,
      approval_status: status || 'pending',
    })
    .eq('user_id', profileId)
  if (e2) throw new Error(e2.message)
  await recomputeTeacherClassCount(sb, profileId)
  await logAdminActivity(sb, `Cập nhật giáo viên ${email}`, 'user', user?.email, user?.id)
}

export async function adminSetTeacherApproval(sb, profileId, approval_status, user) {
  const { error } = await sb.from('teacher_profiles').update({ approval_status }).eq('user_id', profileId)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Duyệt / khóa giáo viên (${approval_status})`, 'user', user?.email, user?.id)
}

/**
 * Tạo user Auth + profile học viên (trigger mặc định). Cần client service role (auth.admin).
 */
export async function adminProvisionStudent(
  sb,
  { email, password, fullName, phone, grade },
  user,
) {
  const em = String(email || '').trim()
  const pw = String(password || '')
  const name = String(fullName || '').trim()
  if (!em || !pw || !name) throw new Error('Email, mật khẩu và họ tên là bắt buộc')
  if (pw.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự')
  const { data, error } = await sb.auth.admin.createUser({
    email: em,
    password: pw,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      ...(phone != null && String(phone).trim() ? { phone: String(phone).trim() } : {}),
    },
  })
  if (error) throw new Error(error.message)
  const uid = data.user?.id
  if (!uid) throw new Error('Không tạo được tài khoản')
  const { error: e2 } = await sb
    .from('student_profiles')
    .update({
      grade_label: grade != null && String(grade).trim() ? String(grade).trim() : null,
      source: 'manual',
    })
    .eq('user_id', uid)
  if (e2) throw new Error(e2.message)
  const ph = phone != null && String(phone).trim() ? String(phone).trim() : null
  if (ph) {
    const { error: e3 } = await sb.from('profiles').update({ phone: ph }).eq('id', uid)
    if (e3) throw new Error(e3.message)
  }
  await logAdminActivity(sb, `Tạo tài khoản học viên: ${em}`, 'user', user?.email, user?.id)
  return { id: uid }
}

/**
 * Tạo user Auth rồi chuyển sang giáo viên (xóa student_profiles, thêm teacher_profiles).
 */
export async function adminProvisionTeacher(sb, { email, password, fullName, subjects }, user) {
  const em = String(email || '').trim()
  const pw = String(password || '')
  const name = String(fullName || '').trim()
  if (!em || !pw || !name) throw new Error('Email, mật khẩu và họ tên là bắt buộc')
  if (pw.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự')
  const { data, error } = await sb.auth.admin.createUser({
    email: em,
    password: pw,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (error) throw new Error(error.message)
  const uid = data.user?.id
  if (!uid) throw new Error('Không tạo được tài khoản')
  const { error: u1 } = await sb.from('profiles').update({ role: 'teacher' }).eq('id', uid)
  if (u1) throw new Error(u1.message)
  const { error: d1 } = await sb.from('student_profiles').delete().eq('user_id', uid)
  if (d1) throw new Error(d1.message)
  const { error: i1 } = await sb.from('teacher_profiles').insert({
    user_id: uid,
    subjects_summary: subjects != null && String(subjects).trim() ? String(subjects).trim() : null,
    approval_status: 'pending',
  })
  if (i1) throw new Error(i1.message)
  await logAdminActivity(sb, `Tạo tài khoản giáo viên: ${em}`, 'user', user?.email, user?.id)
  return { id: uid }
}

function parseJsonField(val, fallback) {
  if (val == null) return fallback
  if (Array.isArray(val)) return val
  if (typeof val === 'object') return val
  if (typeof val === 'string') {
    try {
      return JSON.parse(val)
    } catch {
      return fallback
    }
  }
  return fallback
}

/** @param {import('@supabase/supabase-js').SupabaseClient} sb */
export async function fetchLessonsAdmin(sb) {
  const { data, error } = await sb
    .from('lessons')
    .select('id, subject_id, title, duration_minutes, level_label, sort_order, created_at, subjects(id, name, slug)')
    .order('subject_id')
    .order('sort_order')
    .order('id')
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchLessonDetailsRow(sb, lessonId) {
  const id = Number(lessonId)
  if (!Number.isFinite(id)) return null
  const { data, error } = await sb.from('lesson_details').select('*').eq('lesson_id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function adminInsertLesson(
  sb,
  { subject_id, title, duration_minutes, level_label, sort_order },
  user,
) {
  const sid = Number(subject_id)
  if (!Number.isFinite(sid)) throw new Error('Môn (subject_id) không hợp lệ')
  const t = String(title || '').trim()
  if (!t) throw new Error('Tiêu đề bài giảng là bắt buộc')
  const { data, error } = await sb
    .from('lessons')
    .insert({
      subject_id: sid,
      title: t,
      duration_minutes: duration_minutes != null ? Number(duration_minutes) : null,
      level_label: level_label != null && String(level_label).trim() ? String(level_label).trim() : null,
      sort_order: Number(sort_order) || 0,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const lid = data?.id
  if (lid != null) {
    const { error: dErr } = await sb.from('lesson_details').upsert(
      {
        lesson_id: lid,
        summary: '',
        teacher_name: '',
        youtube_url: null,
        outline: [],
        sections: [],
        resources: [],
        practice_hints: [],
      },
      { onConflict: 'lesson_id' },
    )
    if (dErr) throw new Error(dErr.message)
  }
  await logAdminActivity(sb, `Thêm bài giảng: ${t}`, 'course', user?.email, user?.id)
  return data
}

export async function adminUpdateLesson(sb, id, patch, user) {
  const lid = Number(id)
  if (!Number.isFinite(lid)) throw new Error('ID bài giảng không hợp lệ')
  const body = {}
  if (patch.subject_id != null) body.subject_id = Number(patch.subject_id)
  if (patch.title != null) body.title = String(patch.title).trim()
  if (patch.duration_minutes !== undefined)
    body.duration_minutes = patch.duration_minutes === null || patch.duration_minutes === '' ? null : Number(patch.duration_minutes)
  if (patch.level_label !== undefined)
    body.level_label = patch.level_label != null && String(patch.level_label).trim() ? String(patch.level_label).trim() : null
  if (patch.sort_order != null) body.sort_order = Number(patch.sort_order) || 0
  const { error } = await sb.from('lessons').update(body).eq('id', lid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Cập nhật bài giảng #${lid}`, 'course', user?.email, user?.id)
}

export async function adminDeleteLesson(sb, id, title, user) {
  const lid = Number(id)
  if (!Number.isFinite(lid)) throw new Error('ID bài giảng không hợp lệ')
  const { error } = await sb.from('lessons').delete().eq('id', lid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Xóa bài giảng: ${title || `#${lid}`}`, 'course', user?.email, user?.id)
}

/** Lấy URL video từ body (snake_case / camelCase) — tránh mất dữ liệu khi client gửi tên trường khác. */
function pickYoutubeUrlFromPayload(raw) {
  if (!raw || typeof raw !== 'object') return null
  const v = raw.youtube_url ?? raw.youtubeUrl ?? raw.video_url ?? raw.videoUrl
  if (v == null) return null
  const s = String(v).trim()
  return s || null
}

export async function adminUpsertLessonDetails(sb, lessonId, raw, user) {
  const lid = Number(lessonId)
  if (!Number.isFinite(lid)) throw new Error('ID bài giảng không hợp lệ')
  const yt = pickYoutubeUrlFromPayload(raw)
  const row = {
    lesson_id: lid,
    summary: raw.summary != null ? String(raw.summary) : '',
    teacher_name: raw.teacher_name != null ? String(raw.teacher_name) : '',
    youtube_url: yt,
    outline: parseJsonField(raw.outline, []),
    sections: parseJsonField(raw.sections, []),
    resources: parseJsonField(raw.resources, []),
    practice_hints: parseJsonField(raw.practice_hints, []),
  }
  const { data: saved, error } = await sb
    .from('lesson_details')
    .upsert(row, { onConflict: 'lesson_id' })
    .select('*')
    .maybeSingle()
  if (error) throw new Error(error.message)
  const out = saved ?? (await fetchLessonDetailsRow(sb, lid))
  if (!out) throw new Error('Không đọc lại được bản ghi lesson_details sau khi lưu.')
  await logAdminActivity(sb, `Cập nhật chi tiết bài giảng #${lid}`, 'course', user?.email, user?.id)
  return out
}

function normalizeEmbeddedPostDetails(row) {
  const d = row?.teacher_lesson_post_details
  if (d == null) return null
  return Array.isArray(d) ? d[0] ?? null : d
}

/** Bài giảng đăng trong lớp (teacher_lesson_posts) — admin quản lý toàn bộ. */
export async function fetchTeacherLessonPostsAdmin(sb) {
  const { data: posts, error } = await sb
    .from('teacher_lesson_posts')
    .select(
      'id, class_id, title, body, duration_display, view_count, updated_at, teacher_lesson_post_details ( summary )',
    )
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  const classIds = [...new Set((posts || []).map((p) => p.class_id))]
  const classById = {}
  if (classIds.length) {
    const { data: cls, error: cErr } = await sb
      .from('classes')
      .select('id, name, code, subject, teacher_id')
      .in('id', classIds)
    if (cErr) throw new Error(cErr.message)
    for (const c of cls || []) classById[c.id] = c
  }
  const teacherIds = [...new Set(Object.values(classById).map((c) => c.teacher_id).filter(Boolean))]
  const nameById = {}
  if (teacherIds.length) {
    const { data: profs, error: pErr } = await sb.from('profiles').select('id, full_name').in('id', teacherIds)
    if (pErr) throw new Error(pErr.message)
    for (const p of profs || []) nameById[p.id] = p.full_name
  }
  return (posts || []).map((p) => {
    const c = classById[p.class_id]
    const tid = c?.teacher_id
    const det = normalizeEmbeddedPostDetails(p)
    const sum = det?.summary != null && String(det.summary).trim() ? String(det.summary).trim() : ''
    const legacyBody = p.body != null && String(p.body).trim() ? String(p.body).trim() : ''
    const previewSource = sum || legacyBody
    const contentPreview =
      previewSource.length > 0 ? `${previewSource.slice(0, 100)}${previewSource.length > 100 ? '…' : ''}` : '—'
    return {
      id: p.id,
      class_id: p.class_id,
      class_name: c?.name || `Lớp ${p.class_id}`,
      class_code: c?.code || '',
      subject: c?.subject || '',
      teacher_id: tid ?? null,
      teacher_name: tid ? nameById[tid] || '—' : '—',
      title: p.title,
      body: p.body ?? '',
      content_preview: contentPreview,
      duration_display: p.duration_display || '',
      view_count: p.view_count ?? 0,
      updated_at: p.updated_at,
      updated_label: viDate(p.updated_at),
    }
  })
}

export async function fetchTeacherLessonPostMetaAdmin(sb, postId) {
  const id = Number(postId)
  if (!Number.isFinite(id)) return null
  const { data, error } = await sb
    .from('teacher_lesson_posts')
    .select('id, title, class_id, duration_display')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function fetchTeacherLessonPostDetailsRow(sb, postId) {
  const id = Number(postId)
  if (!Number.isFinite(id)) return null
  const { data, error } = await sb.from('teacher_lesson_post_details').select('*').eq('post_id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function adminUpsertTeacherLessonPostDetails(sb, postId, raw, user) {
  const pid = Number(postId)
  if (!Number.isFinite(pid)) throw new Error('ID bài giảng lớp không hợp lệ')
  const yt = pickYoutubeUrlFromPayload(raw)
  const row = {
    post_id: pid,
    summary: raw.summary != null ? String(raw.summary) : '',
    teacher_name: raw.teacher_name != null ? String(raw.teacher_name) : '',
    youtube_url: yt,
    outline: parseJsonField(raw.outline, []),
    sections: parseJsonField(raw.sections, []),
    resources: parseJsonField(raw.resources, []),
    practice_hints: parseJsonField(raw.practice_hints, []),
  }
  const { data: saved, error } = await sb
    .from('teacher_lesson_post_details')
    .upsert(row, { onConflict: 'post_id' })
    .select('*')
    .maybeSingle()
  if (error) throw new Error(error.message)
  const out = saved ?? (await fetchTeacherLessonPostDetailsRow(sb, pid))
  if (!out) throw new Error('Không đọc lại được chi tiết bài giảng lớp sau khi lưu.')
  await logAdminActivity(sb, `Cập nhật chi tiết bài giảng lớp #${pid}`, 'class', user?.email, user?.id)
  return out
}

export async function adminInsertTeacherLessonPost(sb, raw, user) {
  const class_id = Number(raw.class_id)
  if (!Number.isFinite(class_id)) throw new Error('Lớp (class_id) là bắt buộc')
  const title = String(raw.title || '').trim()
  if (!title) throw new Error('Tiêu đề là bắt buộc')
  const duration_display =
    raw.duration_display != null && String(raw.duration_display).trim()
      ? String(raw.duration_display).trim()
      : null
  const body = raw.body != null && String(raw.body).trim() ? String(raw.body).trim() : null
  const { data: ins, error } = await sb
    .from('teacher_lesson_posts')
    .insert({
      class_id,
      title,
      duration_display,
      body,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const newId = ins?.id
  if (newId != null) {
    const { error: dErr } = await sb.from('teacher_lesson_post_details').upsert(
      {
        post_id: newId,
        summary: body || '',
        teacher_name: '',
        youtube_url: null,
        outline: [],
        sections: [],
        resources: [],
        practice_hints: [],
      },
      { onConflict: 'post_id' },
    )
    if (dErr) throw new Error(dErr.message)
  }
  await logAdminActivity(
    sb,
    `Thêm bài giảng lớp: ${title} (lớp #${class_id})`,
    'class',
    user?.email,
    user?.id,
  )
}

export async function adminUpdateTeacherLessonPost(sb, id, patch, user) {
  const pid = Number(id)
  if (!Number.isFinite(pid)) throw new Error('ID bài giảng lớp không hợp lệ')
  const body = {}
  if (patch.class_id != null) {
    const cid = Number(patch.class_id)
    if (!Number.isFinite(cid)) throw new Error('class_id không hợp lệ')
    body.class_id = cid
  }
  if (patch.title != null) {
    const t = String(patch.title).trim()
    if (!t) throw new Error('Tiêu đề không được để trống')
    body.title = t
  }
  if (patch.duration_display !== undefined) {
    body.duration_display =
      patch.duration_display != null && String(patch.duration_display).trim()
        ? String(patch.duration_display).trim()
        : null
  }
  if (patch.body !== undefined) {
    body.body = patch.body != null && String(patch.body).trim() ? String(patch.body).trim() : null
  }
  if (Object.keys(body).length === 0) throw new Error('Không có trường hợp lệ để cập nhật')
  const { error } = await sb.from('teacher_lesson_posts').update(body).eq('id', pid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Cập nhật bài giảng lớp #${pid}`, 'class', user?.email, user?.id)
}

export async function adminDeleteTeacherLessonPost(sb, id, title, user) {
  const pid = Number(id)
  if (!Number.isFinite(pid)) throw new Error('ID bài giảng lớp không hợp lệ')
  const { error } = await sb.from('teacher_lesson_posts').delete().eq('id', pid)
  if (error) throw new Error(error.message)
  await logAdminActivity(
    sb,
    `Xóa bài giảng lớp: ${title || `#${pid}`}`,
    'class',
    user?.email,
    user?.id,
  )
}

export async function adminInsertSubject(sb, { name, slug, icon_label, sort_order }, user) {
  const n = String(name || '').trim()
  if (!n) throw new Error('Tên môn là bắt buộc')
  const sl = String(slug || '').trim() || slugify(n)
  const { error } = await sb.from('subjects').insert({
    name: n,
    slug: sl,
    icon_label: icon_label != null && String(icon_label).trim() ? String(icon_label).trim() : null,
    sort_order: Number(sort_order) || 0,
  })
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Thêm môn: ${n}`, 'course', user?.email, user?.id)
}

export async function adminUpdateSubject(sb, id, patch, user) {
  const sid = Number(id)
  if (!Number.isFinite(sid)) throw new Error('ID môn không hợp lệ')
  const body = {}
  if (patch.name != null) body.name = String(patch.name).trim()
  if (patch.slug != null) body.slug = String(patch.slug).trim() || slugify(patch.name)
  if (patch.icon_label !== undefined)
    body.icon_label = patch.icon_label != null && String(patch.icon_label).trim() ? String(patch.icon_label).trim() : null
  if (patch.sort_order != null) body.sort_order = Number(patch.sort_order) || 0
  const { error } = await sb.from('subjects').update(body).eq('id', sid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Cập nhật môn #${sid}`, 'course', user?.email, user?.id)
}

export async function adminDeleteSubject(sb, id, name, user) {
  const sid = Number(id)
  if (!Number.isFinite(sid)) throw new Error('ID môn không hợp lệ')
  const { error } = await sb.from('subjects').delete().eq('id', sid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Xóa môn: ${name || `#${sid}`}`, 'course', user?.email, user?.id)
}

export async function fetchPublicTeachersAdmin(sb) {
  const { data, error } = await sb.from('public_teacher_profiles').select('*').order('sort_order').order('id')
  if (error) throw new Error(error.message)
  return data || []
}

export async function adminInsertPublicTeacher(sb, row, user) {
  const name = String(row.name || '').trim()
  if (!name) throw new Error('Tên hiển thị là bắt buộc')
  const insert = {
    name,
    bio: row.bio != null ? String(row.bio) : null,
    initial: row.initial != null && String(row.initial).trim() ? String(row.initial).trim().slice(0, 8) : null,
    color_token: row.color_token != null && String(row.color_token).trim() ? String(row.color_token).trim() : 'indigo',
    sort_order: Number(row.sort_order) || 0,
    user_id: row.user_id && String(row.user_id).trim() ? String(row.user_id).trim() : null,
  }
  if (row.avatar_url != null && String(row.avatar_url).trim()) insert.avatar_url = String(row.avatar_url).trim()
  const { error } = await sb.from('public_teacher_profiles').insert(insert)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Thêm GV trang chủ: ${name}`, 'admin', user?.email, user?.id)
}

export async function adminUpdatePublicTeacher(sb, id, row, user) {
  const tid = Number(id)
  if (!Number.isFinite(tid)) throw new Error('ID không hợp lệ')
  const body = {}
  if (row.name != null) body.name = String(row.name).trim()
  if (row.bio !== undefined) body.bio = row.bio != null ? String(row.bio) : null
  if (row.initial !== undefined) body.initial = row.initial != null && String(row.initial).trim() ? String(row.initial).trim().slice(0, 8) : null
  if (row.color_token !== undefined) body.color_token = row.color_token != null ? String(row.color_token).trim() : null
  if (row.sort_order != null) body.sort_order = Number(row.sort_order) || 0
  if (row.user_id !== undefined) body.user_id = row.user_id && String(row.user_id).trim() ? String(row.user_id).trim() : null
  if (row.avatar_url !== undefined) body.avatar_url = row.avatar_url != null && String(row.avatar_url).trim() ? String(row.avatar_url).trim() : null
  const { error } = await sb.from('public_teacher_profiles').update(body).eq('id', tid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Cập nhật GV trang chủ #${tid}`, 'admin', user?.email, user?.id)
}

export async function adminDeletePublicTeacher(sb, id, name, user) {
  const tid = Number(id)
  if (!Number.isFinite(tid)) throw new Error('ID không hợp lệ')
  const { error } = await sb.from('public_teacher_profiles').delete().eq('id', tid)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Xóa GV trang chủ: ${name || `#${tid}`}`, 'admin', user?.email, user?.id)
}

export async function fetchMarketingLeadsAdmin(sb, limit = 200, offset = 0) {
  const lim = Math.min(500, Math.max(1, Number(limit) || 200))
  const off = Math.max(0, Number(offset) || 0)
  const { data, error, count } = await sb
    .from('marketing_leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(off, off + lim - 1)
  if (error) throw new Error(error.message)
  return { rows: data || [], total: count ?? (data || []).length }
}

const CMS_LANDING_KEYS = ['landing_hero_stats', 'landing_benefits', 'video_preview', 'testimonials', 'admissions_info']

export async function fetchCmsLandingAdmin(sb) {
  const { data, error } = await sb.from('system_settings').select('key, value').in('key', CMS_LANDING_KEYS)
  if (error) throw new Error(error.message)
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]))
  return {
    landing_hero_stats: map.landing_hero_stats || null,
    landing_benefits: Array.isArray(map.landing_benefits) ? map.landing_benefits : [],
    video_preview: map.video_preview && typeof map.video_preview === 'object' ? map.video_preview : {},
    testimonials: Array.isArray(map.testimonials) ? map.testimonials : [],
    admissions_info: map.admissions_info && typeof map.admissions_info === 'object' ? map.admissions_info : {},
  }
}

export async function upsertCmsLandingAdmin(sb, partial, user) {
  const allowed = ['landing_hero_stats', 'landing_benefits', 'video_preview', 'testimonials', 'admissions_info']
  for (const key of allowed) {
    if (!(key in partial)) continue
    const value = partial[key]
    const { error } = await sb.from('system_settings').upsert({ key, value })
    if (error) throw new Error(error.message)
  }
  await logAdminActivity(sb, 'Cập nhật CMS trang chủ (system_settings)', 'system', user?.email, user?.id)
}
