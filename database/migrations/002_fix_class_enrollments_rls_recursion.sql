-- Fix Postgres 42P17: infinite recursion in policy for relation "class_enrollments"
-- Nguyên nhân: classes_select EXISTS class_enrollments ↔ class_enrollments_select EXISTS classes.
-- Chạy trên Supabase: SQL Editor (hoặc psql).

create or replace function public.class_teacher_id(p_class_id bigint)
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select c.teacher_id from public.classes c where c.id = p_class_id;
$$;

revoke all on function public.class_teacher_id(bigint) from public;
grant execute on function public.class_teacher_id(bigint) to authenticated;
grant execute on function public.class_teacher_id(bigint) to service_role;

drop policy if exists class_enrollments_select on public.class_enrollments;
create policy class_enrollments_select on public.class_enrollments
  for select using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or public.class_teacher_id(class_id) = (select auth.uid())
  );

drop policy if exists class_enrollments_modify_teacher_or_admin on public.class_enrollments;
create policy class_enrollments_modify_teacher_or_admin on public.class_enrollments
  for all using (
    (select public.is_admin())
    or public.class_teacher_id(class_id) = (select auth.uid())
  )
  with check (
    (select public.is_admin())
    or public.class_teacher_id(class_id) = (select auth.uid())
  );

-- Tránh JOIN classes trong policy student_profiles (cùng kiểu vòng tham chiếu khi đánh giá).
drop policy if exists student_profiles_select on public.student_profiles;
create policy student_profiles_select on public.student_profiles
  for select using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.class_enrollments ce
      where ce.student_id = public.student_profiles.user_id
        and public.class_teacher_id(ce.class_id) = (select auth.uid())
    )
  );
