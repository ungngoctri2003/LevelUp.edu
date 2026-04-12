-- Thông báo trong app: mỗi hàng gửi tới một profile (admin / giáo viên / học viên).
-- Tạo bản ghi: trigger DB hoặc service role — client anon chỉ đọc + đánh dấu đã đọc.

create table if not exists public.user_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  body        text,
  link_path   text,
  kind        text not null default 'info',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_user_unread_idx
  on public.user_notifications (user_id)
  where read_at is null;

alter table public.user_notifications enable row level security;

drop policy if exists user_notifications_select_own on public.user_notifications;
create policy user_notifications_select_own on public.user_notifications
  for select using (user_id = (select auth.uid()));

drop policy if exists user_notifications_update_own on public.user_notifications;
create policy user_notifications_update_own on public.user_notifications
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Không có policy INSERT/DELETE cho authenticated → client không tự tạo/xóa.

-- Hàm tạo thông báo (service role hoặc trigger SECURITY DEFINER).
create or replace function public.enqueue_user_notification(
  target_user_id uuid,
  p_title text,
  p_body text,
  p_link_path text default null,
  p_kind text default 'info'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_notifications (user_id, title, body, link_path, kind)
  values (
    target_user_id,
    p_title,
    p_body,
    p_link_path,
    coalesce(nullif(trim(p_kind), ''), 'info')
  );
end;
$$;

revoke all on function public.enqueue_user_notification(uuid, text, text, text, text) from public;
grant execute on function public.enqueue_user_notification(uuid, text, text, text, text) to service_role;

-- Khi học viên gửi yêu cầu đổi GV: thông báo tất cả admin.
create or replace function public.notify_admins_new_teacher_change_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_notifications (user_id, title, body, link_path, kind)
  select
    p.id,
    'Yêu cầu đổi giáo viên mới',
    format('Học viên gửi yêu cầu cho lớp id %s.', NEW.class_id),
    '/admin/lop-hoc#admin-teacher-change-requests',
    'teacher_change_request'
  from public.profiles p
  where p.role = 'admin';
  return NEW;
end;
$$;

drop trigger if exists student_teacher_change_requests_notify_admins on public.student_teacher_change_requests;
create trigger student_teacher_change_requests_notify_admins
  after insert on public.student_teacher_change_requests
  for each row
  execute function public.notify_admins_new_teacher_change_request();
