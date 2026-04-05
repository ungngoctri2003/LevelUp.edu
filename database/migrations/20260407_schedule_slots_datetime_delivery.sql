-- Buổi học: mốc ngày giờ + hình thức (trực tuyến / online). Cột day_label, time_range, room giữ cho bản ghi cũ.

alter table public.schedule_slots
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists delivery_mode text not null default 'hoc_online',
  add column if not exists room_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'schedule_slots_delivery_mode_chk'
  ) then
    alter table public.schedule_slots
      add constraint schedule_slots_delivery_mode_chk
      check (delivery_mode in ('truc_tuyen', 'hoc_online'));
  end if;
end $$;

alter table public.schedule_slots alter column day_label drop not null;
alter table public.schedule_slots alter column time_range drop not null;

create index if not exists schedule_slots_starts_at_idx on public.schedule_slots (starts_at);
