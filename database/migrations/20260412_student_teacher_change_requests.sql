-- Yêu cầu đổi giáo viên (học viên → admin xử lý thủ công trên màn Lớp & học viên)

create table if not exists public.student_teacher_change_requests (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles (id) on delete cascade,
  class_id      bigint not null references public.classes (id) on delete cascade,
  status        text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  student_note  text,
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid references public.profiles (id) on delete set null
);

create index if not exists student_teacher_change_requests_student_id_idx
  on public.student_teacher_change_requests (student_id);
create index if not exists student_teacher_change_requests_class_id_idx
  on public.student_teacher_change_requests (class_id);
create index if not exists student_teacher_change_requests_status_created_idx
  on public.student_teacher_change_requests (status, created_at desc);

create unique index if not exists student_teacher_change_requests_one_pending_per_class_student
  on public.student_teacher_change_requests (student_id, class_id)
  where status = 'pending';

drop trigger if exists student_teacher_change_requests_set_updated_at on public.student_teacher_change_requests;
create trigger student_teacher_change_requests_set_updated_at
  before update on public.student_teacher_change_requests
  for each row execute function public.set_updated_at();

alter table public.student_teacher_change_requests enable row level security;

drop policy if exists student_teacher_change_requests_select on public.student_teacher_change_requests;
create policy student_teacher_change_requests_select on public.student_teacher_change_requests
  for select using (
    student_id = (select auth.uid()) or (select public.is_admin())
  );

drop policy if exists student_teacher_change_requests_insert_enrolled on public.student_teacher_change_requests;
create policy student_teacher_change_requests_insert_enrolled on public.student_teacher_change_requests
  for insert with check (
    student_id = (select auth.uid())
    and exists (
      select 1 from public.class_enrollments ce
      where ce.student_id = (select auth.uid())
        and ce.class_id = class_id
    )
  );

drop policy if exists student_teacher_change_requests_update_admin on public.student_teacher_change_requests;
create policy student_teacher_change_requests_update_admin on public.student_teacher_change_requests
  for update using ((select public.is_admin()))
  with check ((select public.is_admin()));
