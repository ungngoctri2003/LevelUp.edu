-- Universal 1:1 chat: canonical participant pair, no role/class gate; merge staff threads into DM.
-- Adds search_users_for_chat RPC and ensure_direct_thread.

-- ---------------------------------------------------------------------------
-- 1) chat_dm_threads: add canonical columns, relax old NOT NULL for transition
-- ---------------------------------------------------------------------------

drop policy if exists chat_dm_threads_select_participant on public.chat_dm_threads;
drop policy if exists chat_dm_threads_update_read_teacher on public.chat_dm_threads;
drop policy if exists chat_dm_threads_update_read_student on public.chat_dm_threads;
drop policy if exists chat_dm_messages_select_participant on public.chat_dm_messages;
drop policy if exists chat_dm_messages_insert_active on public.chat_dm_messages;

drop trigger if exists chat_dm_threads_limit_read on public.chat_dm_threads;

alter table public.chat_dm_threads drop constraint if exists chat_dm_threads_unique_pair;
alter table public.chat_dm_threads drop constraint if exists chat_dm_threads_distinct;

alter table public.chat_dm_threads alter column teacher_id drop not null;
alter table public.chat_dm_threads alter column student_id drop not null;

alter table public.chat_dm_threads
  add column if not exists participant_low uuid references public.profiles (id) on delete cascade,
  add column if not exists participant_high uuid references public.profiles (id) on delete cascade,
  add column if not exists last_read_low timestamptz,
  add column if not exists last_read_high timestamptz;

-- Backfill from legacy teacher/student columns (lexicographic UUID order)
update public.chat_dm_threads t
set
  participant_low = case
    when t.teacher_id is not null and t.student_id is not null
      and t.teacher_id::text < t.student_id::text then t.teacher_id
    when t.teacher_id is not null and t.student_id is not null then t.student_id
    else t.participant_low
  end,
  participant_high = case
    when t.teacher_id is not null and t.student_id is not null
      and t.teacher_id::text < t.student_id::text then t.student_id
    when t.teacher_id is not null and t.student_id is not null then t.teacher_id
    else t.participant_high
  end,
  last_read_low = case
    when t.teacher_id is not null and t.student_id is not null
      and t.teacher_id::text < t.student_id::text then t.teacher_last_read_at
    when t.teacher_id is not null and t.student_id is not null then t.student_last_read_at
    else t.last_read_low
  end,
  last_read_high = case
    when t.teacher_id is not null and t.student_id is not null
      and t.teacher_id::text < t.student_id::text then t.student_last_read_at
    when t.teacher_id is not null and t.student_id is not null then t.teacher_last_read_at
    else t.last_read_high
  end
where t.participant_low is null or t.participant_high is null;

-- ---------------------------------------------------------------------------
-- 2) Merge chat_staff_threads → chat_dm_threads + copy messages
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  lo uuid;
  hi uuid;
  lr_lo timestamptz;
  lr_hi timestamptz;
  tid uuid;
begin
  for r in select * from public.chat_staff_threads loop
    if r.admin_id::text < r.teacher_id::text then
      lo := r.admin_id;
      hi := r.teacher_id;
      lr_lo := r.admin_last_read_at;
      lr_hi := r.teacher_last_read_at;
    else
      lo := r.teacher_id;
      hi := r.admin_id;
      lr_lo := r.teacher_last_read_at;
      lr_hi := r.admin_last_read_at;
    end if;

    select t.id into tid
    from public.chat_dm_threads t
    where t.participant_low = lo and t.participant_high = hi;

    if tid is null then
      insert into public.chat_dm_threads (
        id,
        participant_low, participant_high, last_read_low, last_read_high,
        teacher_id, student_id, created_at, updated_at
      )
      values (r.id, lo, hi, lr_lo, lr_hi, lo, hi, r.created_at, r.updated_at)
      returning id into tid;
    else
      update public.chat_dm_threads t
      set
        last_read_low = case
          when lr_lo is not null and (t.last_read_low is null or lr_lo > t.last_read_low) then lr_lo
          else t.last_read_low
        end,
        last_read_high = case
          when lr_hi is not null and (t.last_read_high is null or lr_hi > t.last_read_high) then lr_hi
          else t.last_read_high
        end,
        updated_at = greatest(t.updated_at, r.updated_at)
      where t.id = tid;
    end if;

    insert into public.chat_dm_messages (id, thread_id, sender_id, body, created_at)
    select gen_random_uuid(), tid, m.sender_id, m.body, m.created_at
    from public.chat_staff_messages m
    where m.thread_id = r.id
      and not exists (
        select 1
        from public.chat_dm_messages d
        where d.thread_id = tid
          and d.sender_id = m.sender_id
          and d.body = m.body
          and d.created_at = m.created_at
      );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Drop legacy columns on chat_dm_threads
-- ---------------------------------------------------------------------------

drop index if exists public.chat_dm_threads_teacher_idx;
drop index if exists public.chat_dm_threads_student_idx;

alter table public.chat_dm_threads drop column if exists teacher_id;
alter table public.chat_dm_threads drop column if exists student_id;
alter table public.chat_dm_threads drop column if exists teacher_last_read_at;
alter table public.chat_dm_threads drop column if exists student_last_read_at;

alter table public.chat_dm_threads alter column participant_low set not null;
alter table public.chat_dm_threads alter column participant_high set not null;

alter table public.chat_dm_threads
  add constraint chat_dm_threads_participant_order check (participant_low::text < participant_high::text);

alter table public.chat_dm_threads
  add constraint chat_dm_threads_unique_participants unique (participant_low, participant_high);

create index if not exists chat_dm_threads_participant_low_idx on public.chat_dm_threads (participant_low);
create index if not exists chat_dm_threads_participant_high_idx on public.chat_dm_threads (participant_high);

-- ---------------------------------------------------------------------------
-- 4) Read-limit trigger (participant_low / participant_high)
-- ---------------------------------------------------------------------------

create or replace function public.chat_dm_threads_limit_read_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) = OLD.participant_low then
    NEW.participant_low := OLD.participant_low;
    NEW.participant_high := OLD.participant_high;
    NEW.last_read_high := OLD.last_read_high;
    NEW.created_at := OLD.created_at;
  elsif (select auth.uid()) = OLD.participant_high then
    NEW.participant_low := OLD.participant_low;
    NEW.participant_high := OLD.participant_high;
    NEW.last_read_low := OLD.last_read_low;
    NEW.created_at := OLD.created_at;
  end if;
  return NEW;
end;
$$;

create trigger chat_dm_threads_limit_read
  before update on public.chat_dm_threads
  for each row execute function public.chat_dm_threads_limit_read_updates();

-- ---------------------------------------------------------------------------
-- 5) RLS chat_dm_threads / chat_dm_messages
-- ---------------------------------------------------------------------------

create policy chat_dm_threads_select_participant on public.chat_dm_threads
  for select using (
    participant_low = (select auth.uid()) or participant_high = (select auth.uid())
  );

create policy chat_dm_threads_update_read_low on public.chat_dm_threads
  for update
  using (participant_low = (select auth.uid()))
  with check (participant_low = (select auth.uid()));

create policy chat_dm_threads_update_read_high on public.chat_dm_threads
  for update
  using (participant_high = (select auth.uid()))
  with check (participant_high = (select auth.uid()));

create policy chat_dm_messages_select_participant on public.chat_dm_messages
  for select using (
    exists (
      select 1 from public.chat_dm_threads t
      where t.id = thread_id
        and (
          t.participant_low = (select auth.uid())
          or t.participant_high = (select auth.uid())
        )
    )
  );

create policy chat_dm_messages_insert_active on public.chat_dm_messages
  for insert
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.chat_dm_threads t
      where t.id = thread_id
        and (
          t.participant_low = (select auth.uid())
          or t.participant_high = (select auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 6) RPC: ensure_direct_thread (replaces ensure_chat_dm_thread)
-- ---------------------------------------------------------------------------

drop function if exists public.ensure_chat_dm_thread(uuid, uuid);

create or replace function public.ensure_direct_thread(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  lo uuid;
  hi uuid;
  tid uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if p_other_user is null or p_other_user = me then
    raise exception 'Invalid peer';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_other_user) then
    raise exception 'User not found';
  end if;

  if me::text < p_other_user::text then
    lo := me;
    hi := p_other_user;
  else
    lo := p_other_user;
    hi := me;
  end if;

  insert into public.chat_dm_threads (participant_low, participant_high)
  values (lo, hi)
  on conflict (participant_low, participant_high) do nothing;

  select t.id into tid
  from public.chat_dm_threads t
  where t.participant_low = lo and t.participant_high = hi;
  return tid;
end;
$$;

revoke all on function public.ensure_direct_thread(uuid) from public;
grant execute on function public.ensure_direct_thread(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7) RPC: search_users_for_chat (limited directory)
-- ---------------------------------------------------------------------------

create or replace function public.search_users_for_chat(p_query text, p_limit int default 20)
returns table (id uuid, full_name text, email text, role text)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p.id, p.full_name, p.email, p.role::text
  from public.profiles p
  where (select auth.uid()) is not null
    and p.id <> (select auth.uid())
    and p.account_status = 'active'
    and length(trim(p_query)) >= 2
    and (
      strpos(lower(p.full_name), lower(trim(p_query))) > 0
      or strpos(lower(p.email), lower(trim(p_query))) > 0
    )
  order by p.full_name asc
  limit least(coalesce(nullif(p_limit, 0), 20), 50);
$$;

revoke all on function public.search_users_for_chat(text, int) from public;
grant execute on function public.search_users_for_chat(text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 8) Deprecate staff chat RPC (optional no-op stub for old clients)
-- ---------------------------------------------------------------------------

create or replace function public.ensure_chat_staff_thread(p_admin_id uuid, p_teacher_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
  other uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if me = p_admin_id then
    other := p_teacher_id;
  elsif me = p_teacher_id then
    other := p_admin_id;
  else
    raise exception 'Forbidden';
  end if;
  return public.ensure_direct_thread(other);
end;
$$;

revoke all on function public.ensure_chat_staff_thread(uuid, uuid) from public;
grant execute on function public.ensure_chat_staff_thread(uuid, uuid) to authenticated;
