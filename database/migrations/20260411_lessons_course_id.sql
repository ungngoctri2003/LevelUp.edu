-- Lessons belong to a course; subject is implied via courses.subject_id.
-- Backfill: pick first course per lesson's former subject (sort_order, id).
-- Subjects with lessons but no course get a placeholder course.

begin;

alter table public.lessons
  add column if not exists course_id bigint references public.courses (id) on delete cascade;

insert into public.courses (subject_id, title, description, visible, sort_order)
select distinct s.id,
  '[Tự động] ' || s.name,
  'Khóa tạo tự động khi gắn bài giảng với khóa học (migration 20260411).',
  true,
  0
from public.subjects s
where exists (select 1 from public.lessons l where l.subject_id = s.id)
  and not exists (select 1 from public.courses c where c.subject_id = s.id);

update public.lessons l
set course_id = (
  select c.id
  from public.courses c
  where c.subject_id = l.subject_id
  order by c.sort_order, c.id
  limit 1
)
where l.course_id is null;

do $$
begin
  if exists (select 1 from public.lessons where course_id is null) then
    raise exception 'lessons.course_id backfill incomplete: rows still null';
  end if;
end $$;

alter table public.lessons alter column course_id set not null;

create index if not exists lessons_course_id_idx on public.lessons (course_id);

alter table public.lessons drop constraint if exists lessons_subject_id_fkey;

drop index if exists public.lessons_subject_id_idx;

alter table public.lessons drop column if exists subject_id;

commit;
