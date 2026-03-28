-- Fix PostgreSQL 42P17: infinite recursion in RLS between public.classes and public.class_enrollments.
-- Run once in Supabase SQL Editor (or psql) on an existing project.
-- Requires PostgreSQL 15+ (SET row_security on functions).

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

create or replace function public.student_enrolled_in_class(p_class_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.class_enrollments ce
    where ce.class_id = p_class_id
      and ce.student_id = (select auth.uid())
  );
$$;

revoke all on function public.student_enrolled_in_class(bigint) from public;
grant execute on function public.student_enrolled_in_class(bigint) to authenticated;
grant execute on function public.student_enrolled_in_class(bigint) to service_role;

drop policy if exists classes_select on public.classes;
drop policy if exists class_enrollments_select on public.class_enrollments;
drop policy if exists class_enrollments_modify_teacher_or_admin on public.class_enrollments;

create policy classes_select on public.classes
  for select using (
    teacher_id = (select auth.uid()) or (select public.is_admin())
    or (select public.student_enrolled_in_class(public.classes.id))
  );

create policy class_enrollments_select on public.class_enrollments
  for select using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or public.class_teacher_id(class_id) = (select auth.uid())
  );

create policy class_enrollments_modify_teacher_or_admin on public.class_enrollments
  for all using (
    (select public.is_admin())
    or public.class_teacher_id(class_id) = (select auth.uid())
  )
  with check (
    (select public.is_admin())
    or public.class_teacher_id(class_id) = (select auth.uid())
  );
