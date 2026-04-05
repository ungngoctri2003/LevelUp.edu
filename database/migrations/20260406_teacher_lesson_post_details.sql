-- Chi tiết bài giảng lớp (cùng cấu trúc lesson_details): tóm tắt, video, dàn ý, mục, gợi ý luyện tập.
create table if not exists public.teacher_lesson_post_details (
  post_id        bigint primary key references public.teacher_lesson_posts (id) on delete cascade,
  summary        text,
  teacher_name   text,
  youtube_url    text,
  outline        jsonb not null default '[]'::jsonb,
  sections       jsonb not null default '[]'::jsonb,
  resources      jsonb not null default '[]'::jsonb,
  practice_hints jsonb not null default '[]'::jsonb
);

alter table public.teacher_lesson_post_details enable row level security;

drop policy if exists teacher_lesson_post_details_select on public.teacher_lesson_post_details;
create policy teacher_lesson_post_details_select on public.teacher_lesson_post_details
  for select using (
    exists (
      select 1 from public.teacher_lesson_posts p
      where p.id = public.teacher_lesson_post_details.post_id
        and (
          (select public.is_admin())
          or exists (
            select 1 from public.classes c
            where c.id = p.class_id and c.teacher_id = (select auth.uid())
          )
          or exists (
            select 1 from public.class_enrollments ce
            where ce.class_id = p.class_id and ce.student_id = (select auth.uid())
          )
        )
    )
  );

drop policy if exists teacher_lesson_post_details_modify on public.teacher_lesson_post_details;
create policy teacher_lesson_post_details_modify on public.teacher_lesson_post_details
  for all
  using (
    exists (
      select 1 from public.teacher_lesson_posts p
      join public.classes c on c.id = p.class_id
      where p.id = public.teacher_lesson_post_details.post_id
        and (
          (select public.is_admin())
          or c.teacher_id = (select auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1 from public.teacher_lesson_posts p
      join public.classes c on c.id = p.class_id
      where p.id = public.teacher_lesson_post_details.post_id
        and (
          (select public.is_admin())
          or c.teacher_id = (select auth.uid())
        )
    )
  );

insert into public.teacher_lesson_post_details (post_id, summary, outline, sections, resources, practice_hints)
select p.id,
  case when trim(coalesce(p.body, '')) <> '' then trim(p.body) else null end,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
from public.teacher_lesson_posts p
where not exists (select 1 from public.teacher_lesson_post_details d where d.post_id = p.id);

create or replace function public.ensure_teacher_lesson_post_details()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.teacher_lesson_post_details (post_id)
  values (new.id)
  on conflict (post_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_teacher_lesson_posts_ensure_details on public.teacher_lesson_posts;
create trigger trg_teacher_lesson_posts_ensure_details
  after insert on public.teacher_lesson_posts
  for each row
  execute function public.ensure_teacher_lesson_post_details();
