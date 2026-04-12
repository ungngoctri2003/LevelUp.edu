-- Realtime chat: DM GV↔HV, DM admin↔GV, chat lớp, nhóm tuỳ chỉnh (neo theo class_id).
-- Thêm policy enrollments: học viên xem roster cùng lớp (chat nhóm / chọn thành viên).
-- Sau khi chạy: bật Realtime cho các bảng chat (một trong hai cách):
--   • Chạy migration 20260419_chat_realtime_publication.sql (ALTER PUBLICATION supabase_realtime), hoặc
--   • Supabase Dashboard → Database → Publications → supabase_realtime → thêm bảng:
--   chat_dm_threads, chat_dm_messages, chat_staff_threads, chat_staff_messages,
--   chat_class_messages, chat_class_read_state,
--   chat_custom_conversations, chat_custom_conversation_members, chat_custom_messages

-- ---------------------------------------------------------------------------
-- Helpers (tránh đệ quy RLS)
-- ---------------------------------------------------------------------------

create or replace function public.teacher_student_share_active_class(p_teacher uuid, p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.classes c
    join public.class_enrollments ce on ce.class_id = c.id and ce.student_id = p_student
    where c.teacher_id = p_teacher
  );
$$;

revoke all on function public.teacher_student_share_active_class(uuid, uuid) from public;
grant execute on function public.teacher_student_share_active_class(uuid, uuid) to authenticated;
grant execute on function public.teacher_student_share_active_class(uuid, uuid) to service_role;

create or replace function public.user_is_class_participant(p_class_id bigint, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (select 1 from public.classes c where c.id = p_class_id and c.teacher_id = p_user_id)
      or exists (
        select 1 from public.class_enrollments ce
        where ce.class_id = p_class_id and ce.student_id = p_user_id
      );
$$;

revoke all on function public.user_is_class_participant(bigint, uuid) from public;
grant execute on function public.user_is_class_participant(bigint, uuid) to authenticated;
grant execute on function public.user_is_class_participant(bigint, uuid) to service_role;

create or replace function public.profile_role(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p.role::text from public.profiles p where p.id = p_user_id;
$$;

revoke all on function public.profile_role(uuid) from public;
grant execute on function public.profile_role(uuid) to authenticated;
grant execute on function public.profile_role(uuid) to service_role;

-- user_member_of_custom_conversation: định nghĩa SAU khi tạo bảng chat_custom_conversation_members (xem cuối phần nhóm tuỳ chỉnh).

-- ---------------------------------------------------------------------------
-- DM: giáo viên ↔ học viên
-- ---------------------------------------------------------------------------

create table if not exists public.chat_dm_threads (
  id                    uuid primary key default gen_random_uuid(),
  teacher_id            uuid not null references public.profiles (id) on delete cascade,
  student_id            uuid not null references public.profiles (id) on delete cascade,
  teacher_last_read_at  timestamptz,
  student_last_read_at  timestamptz,
  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  constraint chat_dm_threads_distinct check (teacher_id <> student_id),
  constraint chat_dm_threads_unique_pair unique (teacher_id, student_id)
);

create index if not exists chat_dm_threads_teacher_idx on public.chat_dm_threads (teacher_id);
create index if not exists chat_dm_threads_student_idx on public.chat_dm_threads (student_id);

create table if not exists public.chat_dm_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.chat_dm_threads (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint chat_dm_messages_body_len check (char_length(body) <= 8000)
);

create index if not exists chat_dm_messages_thread_created_idx
  on public.chat_dm_messages (thread_id, created_at desc);

create or replace function public.chat_dm_threads_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_dm_threads t
  set updated_at = now()
  where t.id = NEW.thread_id;
  return NEW;
end;
$$;

drop trigger if exists chat_dm_messages_touch_thread on public.chat_dm_messages;
create trigger chat_dm_messages_touch_thread
  after insert on public.chat_dm_messages
  for each row execute function public.chat_dm_threads_touch_updated_at();

create or replace function public.chat_dm_threads_limit_read_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) = OLD.teacher_id then
    NEW.student_id := OLD.student_id;
    NEW.teacher_id := OLD.teacher_id;
    NEW.student_last_read_at := OLD.student_last_read_at;
    NEW.created_at := OLD.created_at;
  elsif (select auth.uid()) = OLD.student_id then
    NEW.student_id := OLD.student_id;
    NEW.teacher_id := OLD.teacher_id;
    NEW.teacher_last_read_at := OLD.teacher_last_read_at;
    NEW.created_at := OLD.created_at;
  end if;
  return NEW;
end;
$$;

drop trigger if exists chat_dm_threads_limit_read on public.chat_dm_threads;
create trigger chat_dm_threads_limit_read
  before update on public.chat_dm_threads
  for each row execute function public.chat_dm_threads_limit_read_updates();

alter table public.chat_dm_threads enable row level security;
alter table public.chat_dm_messages enable row level security;

drop policy if exists chat_dm_threads_select_participant on public.chat_dm_threads;
create policy chat_dm_threads_select_participant on public.chat_dm_threads
  for select using (
    teacher_id = (select auth.uid()) or student_id = (select auth.uid())
  );

drop policy if exists chat_dm_threads_update_read_teacher on public.chat_dm_threads;
create policy chat_dm_threads_update_read_teacher on public.chat_dm_threads
  for update
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

drop policy if exists chat_dm_threads_update_read_student on public.chat_dm_threads;
create policy chat_dm_threads_update_read_student on public.chat_dm_threads
  for update
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

drop policy if exists chat_dm_messages_select_participant on public.chat_dm_messages;
create policy chat_dm_messages_select_participant on public.chat_dm_messages
  for select using (
    exists (
      select 1 from public.chat_dm_threads t
      where t.id = thread_id
        and (t.teacher_id = (select auth.uid()) or t.student_id = (select auth.uid()))
    )
  );

drop policy if exists chat_dm_messages_insert_active on public.chat_dm_messages;
create policy chat_dm_messages_insert_active on public.chat_dm_messages
  for insert
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.chat_dm_threads t
      where t.id = thread_id
        and (t.teacher_id = (select auth.uid()) or t.student_id = (select auth.uid()))
        and public.teacher_student_share_active_class(t.teacher_id, t.student_id)
    )
  );

create or replace function public.ensure_chat_dm_thread(p_teacher_id uuid, p_student_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  tid uuid;
  r_teacher text;
  r_student text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if me <> p_teacher_id and me <> p_student_id then
    raise exception 'Forbidden';
  end if;
  if p_teacher_id = p_student_id then
    raise exception 'Invalid pair';
  end if;
  r_teacher := public.profile_role(p_teacher_id);
  r_student := public.profile_role(p_student_id);
  if r_teacher <> 'teacher' or r_student <> 'student' then
    raise exception 'Roles must be teacher and student';
  end if;
  if not public.teacher_student_share_active_class(p_teacher_id, p_student_id) then
    raise exception 'No active class link';
  end if;

  insert into public.chat_dm_threads (teacher_id, student_id)
  values (p_teacher_id, p_student_id)
  on conflict (teacher_id, student_id) do nothing;

  select t.id into tid from public.chat_dm_threads t
  where t.teacher_id = p_teacher_id and t.student_id = p_student_id;
  return tid;
end;
$$;

revoke all on function public.ensure_chat_dm_thread(uuid, uuid) from public;
grant execute on function public.ensure_chat_dm_thread(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- DM: admin ↔ giáo viên
-- ---------------------------------------------------------------------------

create table if not exists public.chat_staff_threads (
  id                    uuid primary key default gen_random_uuid(),
  admin_id              uuid not null references public.profiles (id) on delete cascade,
  teacher_id            uuid not null references public.profiles (id) on delete cascade,
  admin_last_read_at    timestamptz,
  teacher_last_read_at  timestamptz,
  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  constraint chat_staff_threads_distinct check (admin_id <> teacher_id),
  constraint chat_staff_threads_unique_pair unique (admin_id, teacher_id)
);

create index if not exists chat_staff_threads_admin_idx on public.chat_staff_threads (admin_id);
create index if not exists chat_staff_threads_teacher_idx on public.chat_staff_threads (teacher_id);

create table if not exists public.chat_staff_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.chat_staff_threads (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint chat_staff_messages_body_len check (char_length(body) <= 8000)
);

create index if not exists chat_staff_messages_thread_created_idx
  on public.chat_staff_messages (thread_id, created_at desc);

create or replace function public.chat_staff_threads_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_staff_threads t set updated_at = now() where t.id = NEW.thread_id;
  return NEW;
end;
$$;

drop trigger if exists chat_staff_messages_touch_thread on public.chat_staff_messages;
create trigger chat_staff_messages_touch_thread
  after insert on public.chat_staff_messages
  for each row execute function public.chat_staff_threads_touch_updated_at();

create or replace function public.chat_staff_threads_limit_read_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) = OLD.admin_id then
    NEW.teacher_id := OLD.teacher_id;
    NEW.admin_id := OLD.admin_id;
    NEW.teacher_last_read_at := OLD.teacher_last_read_at;
    NEW.created_at := OLD.created_at;
  elsif (select auth.uid()) = OLD.teacher_id then
    NEW.teacher_id := OLD.teacher_id;
    NEW.admin_id := OLD.admin_id;
    NEW.admin_last_read_at := OLD.admin_last_read_at;
    NEW.created_at := OLD.created_at;
  end if;
  return NEW;
end;
$$;

drop trigger if exists chat_staff_threads_limit_read on public.chat_staff_threads;
create trigger chat_staff_threads_limit_read
  before update on public.chat_staff_threads
  for each row execute function public.chat_staff_threads_limit_read_updates();

alter table public.chat_staff_threads enable row level security;
alter table public.chat_staff_messages enable row level security;

drop policy if exists chat_staff_threads_select_participant on public.chat_staff_threads;
create policy chat_staff_threads_select_participant on public.chat_staff_threads
  for select using (admin_id = (select auth.uid()) or teacher_id = (select auth.uid()));

drop policy if exists chat_staff_threads_update_read_admin on public.chat_staff_threads;
create policy chat_staff_threads_update_read_admin on public.chat_staff_threads
  for update using (admin_id = (select auth.uid())) with check (admin_id = (select auth.uid()));

drop policy if exists chat_staff_threads_update_read_teacher on public.chat_staff_threads;
create policy chat_staff_threads_update_read_teacher on public.chat_staff_threads
  for update using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));

drop policy if exists chat_staff_messages_select_participant on public.chat_staff_messages;
create policy chat_staff_messages_select_participant on public.chat_staff_messages
  for select using (
    exists (
      select 1 from public.chat_staff_threads t
      where t.id = thread_id
        and (t.admin_id = (select auth.uid()) or t.teacher_id = (select auth.uid()))
    )
  );

drop policy if exists chat_staff_messages_insert_participant on public.chat_staff_messages;
create policy chat_staff_messages_insert_participant on public.chat_staff_messages
  for insert
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.chat_staff_threads t
      where t.id = thread_id
        and (t.admin_id = (select auth.uid()) or t.teacher_id = (select auth.uid()))
    )
  );

create or replace function public.ensure_chat_staff_thread(p_admin_id uuid, p_teacher_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  tid uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if me <> p_admin_id and me <> p_teacher_id then raise exception 'Forbidden'; end if;
  if public.profile_role(p_admin_id) <> 'admin' then raise exception 'Not admin'; end if;
  if public.profile_role(p_teacher_id) <> 'teacher' then raise exception 'Not teacher'; end if;

  insert into public.chat_staff_threads (admin_id, teacher_id)
  values (p_admin_id, p_teacher_id)
  on conflict (admin_id, teacher_id) do nothing;

  select t.id into tid from public.chat_staff_threads t
  where t.admin_id = p_admin_id and t.teacher_id = p_teacher_id;
  return tid;
end;
$$;

revoke all on function public.ensure_chat_staff_thread(uuid, uuid) from public;
grant execute on function public.ensure_chat_staff_thread(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Chat nhóm lớp
-- ---------------------------------------------------------------------------

create table if not exists public.chat_class_messages (
  id          uuid primary key default gen_random_uuid(),
  class_id    bigint not null references public.classes (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint chat_class_messages_body_len check (char_length(body) <= 8000)
);

create index if not exists chat_class_messages_class_created_idx
  on public.chat_class_messages (class_id, created_at desc);

create table if not exists public.chat_class_read_state (
  class_id      bigint not null references public.classes (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  last_read_at  timestamptz,
  primary key (class_id, user_id)
);

create index if not exists chat_class_read_state_user_idx on public.chat_class_read_state (user_id);

alter table public.chat_class_messages enable row level security;
alter table public.chat_class_read_state enable row level security;

drop policy if exists chat_class_messages_select_member on public.chat_class_messages;
create policy chat_class_messages_select_member on public.chat_class_messages
  for select using (
    public.user_is_class_participant(class_id, (select auth.uid()))
  );

drop policy if exists chat_class_messages_insert_member on public.chat_class_messages;
create policy chat_class_messages_insert_member on public.chat_class_messages
  for insert
  with check (
    sender_id = (select auth.uid())
    and public.user_is_class_participant(class_id, (select auth.uid()))
  );

drop policy if exists chat_class_read_select_own on public.chat_class_read_state;
create policy chat_class_read_select_own on public.chat_class_read_state
  for select using (
    user_id = (select auth.uid())
    and public.user_is_class_participant(class_id, (select auth.uid()))
  );

drop policy if exists chat_class_read_upsert_own on public.chat_class_read_state;
create policy chat_class_read_upsert_own on public.chat_class_read_state
  for insert
  with check (
    user_id = (select auth.uid())
    and public.user_is_class_participant(class_id, (select auth.uid()))
  );

drop policy if exists chat_class_read_update_own on public.chat_class_read_state;
create policy chat_class_read_update_own on public.chat_class_read_state
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Nhóm tuỳ chỉnh (neo lớp)
-- ---------------------------------------------------------------------------

create table if not exists public.chat_custom_conversations (
  id               uuid primary key default gen_random_uuid(),
  title            text not null default '',
  anchor_class_id  bigint not null references public.classes (id) on delete cascade,
  created_by       uuid not null references public.profiles (id) on delete cascade,
  updated_at       timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  constraint chat_custom_title_len check (char_length(title) <= 200)
);

create index if not exists chat_custom_conversations_anchor_idx
  on public.chat_custom_conversations (anchor_class_id);

create table if not exists public.chat_custom_conversation_members (
  conversation_id  uuid not null references public.chat_custom_conversations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  last_read_at     timestamptz,
  primary key (conversation_id, user_id)
);

create index if not exists chat_custom_members_user_idx on public.chat_custom_conversation_members (user_id);

create table if not exists public.chat_custom_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.chat_custom_conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  constraint chat_custom_messages_body_len check (char_length(body) <= 8000)
);

create index if not exists chat_custom_messages_conv_created_idx
  on public.chat_custom_messages (conversation_id, created_at desc);

create or replace function public.chat_custom_conversations_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_custom_conversations c set updated_at = now() where c.id = NEW.conversation_id;
  return NEW;
end;
$$;

drop trigger if exists chat_custom_messages_touch_conv on public.chat_custom_messages;
create trigger chat_custom_messages_touch_conv
  after insert on public.chat_custom_messages
  for each row execute function public.chat_custom_conversations_touch_updated_at();

create or replace function public.user_member_of_custom_conversation(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.chat_custom_conversation_members m
    where m.conversation_id = p_conversation_id and m.user_id = p_user_id
  );
$$;

revoke all on function public.user_member_of_custom_conversation(uuid, uuid) from public;
grant execute on function public.user_member_of_custom_conversation(uuid, uuid) to authenticated;
grant execute on function public.user_member_of_custom_conversation(uuid, uuid) to service_role;

alter table public.chat_custom_conversations enable row level security;
alter table public.chat_custom_conversation_members enable row level security;
alter table public.chat_custom_messages enable row level security;

drop policy if exists chat_custom_conv_select_member on public.chat_custom_conversations;
create policy chat_custom_conv_select_member on public.chat_custom_conversations
  for select using (
    public.user_member_of_custom_conversation(id, (select auth.uid()))
  );

drop policy if exists chat_custom_members_select_peer on public.chat_custom_conversation_members;
create policy chat_custom_members_select_peer on public.chat_custom_conversation_members
  for select using (
    public.user_member_of_custom_conversation(conversation_id, (select auth.uid()))
  );

drop policy if exists chat_custom_members_update_read on public.chat_custom_conversation_members;
create policy chat_custom_members_update_read on public.chat_custom_conversation_members
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists chat_custom_messages_select_member on public.chat_custom_messages;
create policy chat_custom_messages_select_member on public.chat_custom_messages
  for select using (
    public.user_member_of_custom_conversation(conversation_id, (select auth.uid()))
  );

drop policy if exists chat_custom_messages_insert_active on public.chat_custom_messages;
create policy chat_custom_messages_insert_active on public.chat_custom_messages
  for insert
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_custom_conversation_members m
      join public.chat_custom_conversations c on c.id = m.conversation_id
      where m.conversation_id = conversation_id
        and m.user_id = (select auth.uid())
        and public.user_is_class_participant(c.anchor_class_id, (select auth.uid()))
    )
  );

create or replace function public.create_custom_group_chat(
  p_class_id bigint,
  p_title text,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  cid uuid;
  u uuid;
  members uuid[];
  m uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not public.user_is_class_participant(p_class_id, me) then
    raise exception 'Not a participant of this class';
  end if;

  members := array(
    select distinct unnest(coalesce(p_member_ids, array[]::uuid[]) || me)
  );
  if coalesce(array_length(members, 1), 0) < 2 then
    raise exception 'At least 2 members required';
  end if;

  foreach m in array members
  loop
    if not public.user_is_class_participant(p_class_id, m) then
      raise exception 'Invalid member %', m;
    end if;
  end loop;

  insert into public.chat_custom_conversations (title, anchor_class_id, created_by)
  values (coalesce(nullif(trim(p_title), ''), 'Nhóm'), p_class_id, me)
  returning id into cid;

  foreach u in array members
  loop
    insert into public.chat_custom_conversation_members (conversation_id, user_id)
    values (cid, u);
  end loop;

  return cid;
end;
$$;

revoke all on function public.create_custom_group_chat(bigint, text, uuid[]) from public;
grant execute on function public.create_custom_group_chat(bigint, text, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- profiles: đọc tối thiểu cho danh bạ chat (tên / email)
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select_teachers_of_student_classes on public.profiles;
create policy profiles_select_teachers_of_student_classes on public.profiles
  for select using (
    role = 'teacher'
    and exists (
      select 1
      from public.classes c
      join public.class_enrollments ce on ce.class_id = c.id
      where c.teacher_id = profiles.id
        and ce.student_id = (select auth.uid())
    )
  );

drop policy if exists profiles_select_classmates on public.profiles;
create policy profiles_select_classmates on public.profiles
  for select using (
    role = 'student'
    and exists (
      select 1
      from public.class_enrollments ce1
      join public.class_enrollments ce2 on ce2.class_id = ce1.class_id
      where ce1.student_id = (select auth.uid())
        and ce2.student_id = profiles.id
    )
  );

drop policy if exists profiles_select_admins_for_teachers on public.profiles;
create policy profiles_select_admins_for_teachers on public.profiles
  for select using (
    role = 'admin'
    and (select public.is_teacher())
  );

-- Không dùng EXISTS vào class_enrollments (gây đệ quy RLS). Dùng helper có row_security = off.
drop policy if exists class_enrollments_select_peers_same_class on public.class_enrollments;
create policy class_enrollments_select_peers_same_class on public.class_enrollments
  for select using (
    public.student_enrolled_in_class(class_id)
  );
