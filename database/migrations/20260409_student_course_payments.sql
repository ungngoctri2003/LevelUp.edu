-- Giá niêm yết khóa học (catalog) — dùng cho thanh toán mua khóa trực tuyến
alter table public.courses
  add column if not exists list_price numeric(12, 2);

comment on column public.courses.list_price is 'Giá khóa học (VND); null = chưa mở bán trực tuyến / liên hệ';

-- Thanh toán mua khóa học (khác với thanh toán theo lớp)
create table if not exists public.student_course_payments (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid references public.profiles (id) on delete set null,
  course_id      bigint not null references public.courses (id) on delete cascade,
  student_name   text not null,
  student_email  text,
  student_phone  text,
  payment_source public.payment_source not null default 'bank_transfer',
  payment_status public.payment_status not null default 'pending',
  amount         numeric(12, 2),
  note           text,
  admin_note     text,
  submitted_at   timestamptz not null default now(),
  confirmed_at   timestamptz,
  confirmed_by   uuid references public.profiles (id) on delete set null,
  updated_at     timestamptz not null default now()
);

create index if not exists student_course_payments_course_id_idx
  on public.student_course_payments (course_id);
create index if not exists student_course_payments_student_id_idx
  on public.student_course_payments (student_id);
create index if not exists student_course_payments_status_idx
  on public.student_course_payments (payment_status, submitted_at desc);

create unique index if not exists student_course_payments_active_unique_idx
  on public.student_course_payments (student_id, course_id)
  where student_id is not null and payment_status in ('pending', 'paid');

drop trigger if exists student_course_payments_set_updated_at on public.student_course_payments;
create trigger student_course_payments_set_updated_at
  before update on public.student_course_payments
  for each row execute function public.set_updated_at();

alter table public.student_course_payments enable row level security;

drop policy if exists student_course_payments_select on public.student_course_payments;
create policy student_course_payments_select on public.student_course_payments
  for select using (
    student_id = (select auth.uid()) or (select public.is_admin())
  );

drop policy if exists student_course_payments_insert_own_or_admin on public.student_course_payments;
create policy student_course_payments_insert_own_or_admin on public.student_course_payments
  for insert with check (
    student_id = (select auth.uid()) or (select public.is_admin())
  );

drop policy if exists student_course_payments_update_admin on public.student_course_payments;
create policy student_course_payments_update_admin on public.student_course_payments
  for update using ((select public.is_admin()))
  with check ((select public.is_admin()));
