-- Thông báo tự động: trigger sau ghi DB (bắt cả client Supabase và API).
-- Cần đã chạy 20260413_user_notifications.sql (bảng user_notifications + enqueue_user_notification).

-- ---------------------------------------------------------------------------
-- Ghi danh lớp → học viên + giáo viên chủ nhiệm
-- ---------------------------------------------------------------------------
create or replace function public.notify_class_enrollment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cname text;
  tid uuid;
begin
  select c.name, c.teacher_id into cname, tid
  from public.classes c
  where c.id = NEW.class_id;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  values (
    NEW.student_id,
    'Bạn đã được ghi danh vào lớp',
    coalesce(format('Lớp: %s.', cname), format('Lớp id %s.', NEW.class_id)),
    '/hoc-vien/khoa-hoc#student-section-lop',
    'enrollment'
  );

  if tid is not null then
    insert into public.user_notifications (user_id, title, body, link_path, kind)
    values (
      tid,
      'Học viên mới ghi danh lớp',
      coalesce(format('Lớp %s có học viên mới.', cname), format('Lớp id %s.', NEW.class_id)),
      '/giao-vien/lop-hoc',
      'enrollment'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists class_enrollments_notify on public.class_enrollments;
create trigger class_enrollments_notify
  after insert on public.class_enrollments
  for each row
  execute function public.notify_class_enrollment_insert();

-- ---------------------------------------------------------------------------
-- Bài giảng trong lớp (teacher_lesson_posts) → mọi học viên đã ghi danh
-- ---------------------------------------------------------------------------
create or replace function public.notify_students_new_lesson_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cname text;
begin
  select c.name into cname from public.classes c where c.id = NEW.class_id;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select distinct
    ce.student_id,
    'Bài giảng mới trong lớp',
    format(
      '«%s» — %s.',
      left(NEW.title, 200),
      coalesce(cname, format('lớp id %s', NEW.class_id))
    ),
    '/hoc-vien/khoa-hoc#student-section-bai-giang',
    'lesson_post'
  from public.class_enrollments ce
  where ce.class_id = NEW.class_id;

  return NEW;
end;
$$;

drop trigger if exists teacher_lesson_posts_notify_students on public.teacher_lesson_posts;
create trigger teacher_lesson_posts_notify_students
  after insert on public.teacher_lesson_posts
  for each row
  execute function public.notify_students_new_lesson_post();

-- ---------------------------------------------------------------------------
-- Bài tập mới → học viên trong lớp
-- ---------------------------------------------------------------------------
create or replace function public.notify_students_new_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cname text;
begin
  select c.name into cname from public.classes c where c.id = NEW.class_id;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select distinct
    ce.student_id,
    'Bài tập mới',
    format(
      '«%s» — lớp %s.',
      left(NEW.title, 200),
      coalesce(cname, format('id %s', NEW.class_id))
    ),
    '/hoc-vien/khoa-hoc#student-section-bai-tap',
    'assignment'
  from public.class_enrollments ce
  where ce.class_id = NEW.class_id;

  return NEW;
end;
$$;

drop trigger if exists assignments_notify_students on public.assignments;
create trigger assignments_notify_students
  after insert on public.assignments
  for each row
  execute function public.notify_students_new_assignment();

-- ---------------------------------------------------------------------------
-- Buổi học mới (schedule_slots INSERT) → học viên trong lớp
-- ---------------------------------------------------------------------------
create or replace function public.notify_students_new_schedule_slot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cname text;
begin
  select c.name into cname from public.classes c where c.id = NEW.class_id;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select distinct
    ce.student_id,
    'Lịch học mới',
    format(
      'Lớp %s có buổi học mới%s',
      coalesce(cname, format('id %s', NEW.class_id)),
      case
        when nullif(trim(both ' ' from concat_ws(' ', NEW.day_label, NEW.time_range)), '') is not null then
          format(' (%s).', trim(both ' ' from concat_ws(' ', NEW.day_label, NEW.time_range)))
        else '.'
      end
    ),
    '/hoc-vien/khoa-hoc#student-section-lich-lop',
    'schedule'
  from public.class_enrollments ce
  where ce.class_id = NEW.class_id;

  return NEW;
end;
$$;

drop trigger if exists schedule_slots_notify_students on public.schedule_slots;
create trigger schedule_slots_notify_students
  after insert on public.schedule_slots
  for each row
  execute function public.notify_students_new_schedule_slot();

-- ---------------------------------------------------------------------------
-- Học viên nộp bài → giáo viên chủ nhiệm lớp
-- ---------------------------------------------------------------------------
create or replace function public.notify_teacher_new_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  atitle text;
  cname text;
begin
  select c.teacher_id, a.title, c.name
  into tid, atitle, cname
  from public.assignments a
  join public.classes c on c.id = a.class_id
  where a.id = NEW.assignment_id;

  if tid is null then
    return NEW;
  end if;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  values (
    tid,
    'Học viên đã nộp bài tập',
    format(
      'Bài «%s» (lớp %s) có bài nộp mới.',
      left(coalesce(atitle, '—'), 160),
      coalesce(cname, '—')
    ),
    '/giao-vien/cham-diem',
    'submission'
  );

  return NEW;
end;
$$;

drop trigger if exists assignment_submissions_notify_teacher on public.assignment_submissions;
create trigger assignment_submissions_notify_teacher
  after insert on public.assignment_submissions
  for each row
  execute function public.notify_teacher_new_submission();

-- ---------------------------------------------------------------------------
-- Giáo viên chấm xong (status → graded) → học viên
-- ---------------------------------------------------------------------------
create or replace function public.notify_student_submission_graded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  atitle text;
begin
  if TG_OP <> 'UPDATE' then
    return NEW;
  end if;
  if OLD.status is not distinct from NEW.status or NEW.status <> 'graded'::public.grading_status then
    return NEW;
  end if;

  select a.title into atitle from public.assignments a where a.id = NEW.assignment_id;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  values (
    NEW.student_id,
    'Bài tập đã được chấm',
    format(
      '«%s» — điểm: %s.',
      left(coalesce(atitle, 'Bài tập'), 160),
      coalesce(NEW.score::text, '—')
    ),
    '/hoc-vien/khoa-hoc#student-section-bai-tap',
    'graded'
  );

  return NEW;
end;
$$;

drop trigger if exists assignment_submissions_notify_student_graded on public.assignment_submissions;
create trigger assignment_submissions_notify_student_graded
  after update on public.assignment_submissions
  for each row
  execute function public.notify_student_submission_graded();

-- ---------------------------------------------------------------------------
-- Admin đổi approval_status giáo viên → giáo viên
-- ---------------------------------------------------------------------------
create or replace function public.notify_teacher_approval_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP <> 'UPDATE' then
    return NEW;
  end if;
  if OLD.approval_status is not distinct from NEW.approval_status then
    return NEW;
  end if;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  values (
    NEW.user_id,
    'Cập nhật trạng thái duyệt tài khoản',
    format('Trạng thái: %s.', coalesce(NEW.approval_status::text, '—')),
    '/giao-vien/ho-so',
    'teacher_approval'
  );

  return NEW;
end;
$$;

drop trigger if exists teacher_profiles_notify_approval on public.teacher_profiles;
create trigger teacher_profiles_notify_approval
  after update on public.teacher_profiles
  for each row
  execute function public.notify_teacher_approval_changed();

-- ---------------------------------------------------------------------------
-- Lead marketing → admin
-- ---------------------------------------------------------------------------
create or replace function public.notify_admins_marketing_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select
    p.id,
    'Lead marketing mới',
    format('Liên hệ: %s (%s).', left(NEW.full_name, 120), left(NEW.email, 120)),
    '/admin',
    'marketing_lead'
  from public.profiles p
  where p.role = 'admin';

  return NEW;
end;
$$;

drop trigger if exists marketing_leads_notify_admins on public.marketing_leads;
create trigger marketing_leads_notify_admins
  after insert on public.marketing_leads
  for each row
  execute function public.notify_admins_marketing_lead();

-- ---------------------------------------------------------------------------
-- Đơn tuyển sinh → admin
-- ---------------------------------------------------------------------------
create or replace function public.notify_admins_admission_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select
    p.id,
    'Đơn tuyển sinh mới',
    format('Học sinh: %s — %s.', left(NEW.student_name, 120), left(NEW.parent_phone, 40)),
    '/admin/thanh-toan',
    'admission'
  from public.profiles p
  where p.role = 'admin';

  return NEW;
end;
$$;

drop trigger if exists admission_applications_notify_admins on public.admission_applications;
create trigger admission_applications_notify_admins
  after insert on public.admission_applications
  for each row
  execute function public.notify_admins_admission_application();

-- ---------------------------------------------------------------------------
-- Yêu cầu thanh toán lớp → admin (+ học viên nếu đã đăng nhập gắn student_id)
-- ---------------------------------------------------------------------------
create or replace function public.notify_class_payment_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cname text;
begin
  select c.name into cname from public.classes c where c.id = NEW.class_id;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select
    p.id,
    'Yêu cầu thanh toán lớp mới',
    format(
      '%s — lớp %s (id %s).',
      left(NEW.student_name, 100),
      coalesce(cname, '—'),
      NEW.class_id
    ),
    '/admin/thanh-toan',
    'payment_class'
  from public.profiles p
  where p.role = 'admin';

  if NEW.student_id is not null then
    insert into public.user_notifications (user_id, title, body, link_path, kind)
    values (
      NEW.student_id,
      'Đã gửi yêu cầu thanh toán lớp',
      coalesce(
        format('Lớp %s — chờ trung tâm xác nhận.', cname),
        format('Lớp id %s.', NEW.class_id)
      ),
      '/hoc-vien/khoa-hoc#student-section-thanh-toan',
      'payment_class'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists student_class_payments_notify on public.student_class_payments;
create trigger student_class_payments_notify
  after insert on public.student_class_payments
  for each row
  execute function public.notify_class_payment_request();

-- ---------------------------------------------------------------------------
-- Yêu cầu thanh toán khóa → admin (+ học viên nếu có student_id)
-- ---------------------------------------------------------------------------
create or replace function public.notify_course_payment_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  crtitle text;
begin
  select c.title into crtitle from public.courses c where c.id = NEW.course_id;

  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select
    p.id,
    'Yêu cầu thanh toán khóa học mới',
    format(
      '%s — khóa %s.',
      left(NEW.student_name, 100),
      left(coalesce(crtitle, format('id %s', NEW.course_id)), 120)
    ),
    '/admin/thanh-toan',
    'payment_course'
  from public.profiles p
  where p.role = 'admin';

  if NEW.student_id is not null then
    insert into public.user_notifications (user_id, title, body, link_path, kind)
    values (
      NEW.student_id,
      'Đã gửi yêu cầu thanh toán khóa',
      coalesce(
        format('Khóa %s — chờ trung tâm xác nhận.', crtitle),
        format('Khóa id %s.', NEW.course_id)
      ),
      '/hoc-vien/khoa-hoc-da-dang-ky',
      'payment_course'
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists student_course_payments_notify on public.student_course_payments;
create trigger student_course_payments_notify
  after insert on public.student_course_payments
  for each row
  execute function public.notify_course_payment_request();
