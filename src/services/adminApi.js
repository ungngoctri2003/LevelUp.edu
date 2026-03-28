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
  await sb.from('admin_activity_logs').insert({
    action,
    type,
    actor_email: actorEmail,
    actor_user_id: actorUserId,
  })
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
    level: e.level_label || '',
    assigned: !!e.assigned,
    published: e.published !== false,
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
  const { data, error } = await sb
    .from('profiles')
    .select('*, teacher_profiles(*)')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((p) => {
    const tp = p.teacher_profiles
    return {
      id: p.id,
      name: p.full_name,
      email: p.email,
      subjects: tp?.subjects_summary || '—',
      classes: tp?.class_count_cache ?? 0,
      status: tp?.approval_status || 'pending',
      account_status: p.account_status,
    }
  })
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
  const qCount = Number(row.questions) || 10
  const { error } = await sb.from('exams').insert({
    title: row.title.trim(),
    subject_label: row.subject?.trim() || 'Môn học',
    duration_minutes: Number(row.duration) || 45,
    question_count: qCount,
    questions: Array.isArray(row.questionItems) ? row.questionItems : [],
    level_label: row.level || null,
    assigned: !!row.assigned,
    published: row.published !== false,
  })
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Tạo đề: ${row.title}`, 'course', user?.email, user?.id)
}

export async function adminUpdateExam(sb, id, row, user) {
  const body = {
    title: row.title.trim(),
    subject_label: row.subject?.trim() || 'Môn học',
    duration_minutes: Number(row.duration) || 45,
    question_count: Number(row.questions) || 10,
    level_label: row.level || null,
    assigned: !!row.assigned,
    published: row.published !== false,
  }
  if (Array.isArray(row.questionItems)) body.questions = row.questionItems
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
  await sb.from('profiles').update({ account_status: acc }).eq('id', profileId)
  await sb.from('student_profiles').update({ status: st }).eq('user_id', profileId)
  await logAdminActivity(sb, `${makeLearningActive ? 'Mở' : 'Khóa'} tài khoản học viên`, 'user', user?.email, user?.id)
}

export async function adminSetStudentAccountStatus(sb, profileId, account_status, user) {
  const { error } = await sb.from('profiles').update({ account_status }).eq('id', profileId)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Trạng thái tài khoản học viên: ${account_status}`, 'user', user?.email, user?.id)
}

export async function adminUpdateTeacher(sb, profileId, { name, email, subjects, classes, status }, user) {
  const { error: e1 } = await sb
    .from('profiles')
    .update({ full_name: name.trim(), email: email.trim() })
    .eq('id', profileId)
  if (e1) throw new Error(e1.message)
  const { error: e2 } = await sb
    .from('teacher_profiles')
    .update({
      subjects_summary: subjects?.trim() || null,
      class_count_cache: Math.max(0, Number(classes) || 0),
      approval_status: status || 'pending',
    })
    .eq('user_id', profileId)
  if (e2) throw new Error(e2.message)
  await logAdminActivity(sb, `Cập nhật giáo viên ${email}`, 'user', user?.email, user?.id)
}

export async function adminSetTeacherApproval(sb, profileId, approval_status, user) {
  const { error } = await sb.from('teacher_profiles').update({ approval_status }).eq('user_id', profileId)
  if (error) throw new Error(error.message)
  await logAdminActivity(sb, `Duyệt / khóa giáo viên (${approval_status})`, 'user', user?.email, user?.id)
}
