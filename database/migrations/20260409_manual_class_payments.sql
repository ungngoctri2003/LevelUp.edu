do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_source') then
    create type public.payment_source as enum ('cash', 'bank_transfer', 'momo', 'vnpay', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid', 'cancelled');
  end if;
end $$;

alter table public.classes
  add column if not exists sales_enabled boolean not null default false,
  add column if not exists tuition_fee numeric(12, 2),
  add column if not exists sales_note text;

create index if not exists classes_sales_enabled_idx
  on public.classes (sales_enabled, id)
  where sales_enabled = true;

create table if not exists public.student_class_payments (
  id             bigint generated always as identity primary key,
  student_id     uuid references public.profiles (id) on delete set null,
  class_id       bigint not null references public.classes (id) on delete cascade,
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
  enrolled_at    timestamptz,
  updated_at     timestamptz not null default now()
);

create index if not exists student_class_payments_class_id_idx
  on public.student_class_payments (class_id);
create index if not exists student_class_payments_student_id_idx
  on public.student_class_payments (student_id);
create index if not exists student_class_payments_status_idx
  on public.student_class_payments (payment_status, submitted_at desc);
create unique index if not exists student_class_payments_active_unique_idx
  on public.student_class_payments (student_id, class_id)
  where student_id is not null and payment_status in ('pending', 'paid');

drop trigger if exists student_class_payments_set_updated_at on public.student_class_payments;
create trigger student_class_payments_set_updated_at
  before update on public.student_class_payments
  for each row execute function public.set_updated_at();

alter table public.student_class_payments enable row level security;

drop policy if exists student_class_payments_select on public.student_class_payments;
create policy student_class_payments_select on public.student_class_payments
  for select using (
    student_id = (select auth.uid()) or (select public.is_admin())
  );

drop policy if exists student_class_payments_insert_own_or_admin on public.student_class_payments;
create policy student_class_payments_insert_own_or_admin on public.student_class_payments
  for insert with check (
    student_id = (select auth.uid()) or (select public.is_admin())
  );

drop policy if exists student_class_payments_update_admin on public.student_class_payments;
create policy student_class_payments_update_admin on public.student_class_payments
  for update using ((select public.is_admin()))
  with check ((select public.is_admin()));
