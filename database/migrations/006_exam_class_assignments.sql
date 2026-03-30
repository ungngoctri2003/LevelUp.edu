-- Giao đề kiểm tra (kho đề) cho từng lớp — giáo viên gán exam ↔ class

create table if not exists public.exam_class_assignments (
  exam_id bigint not null references public.exams (id) on delete cascade,
  class_id bigint not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (exam_id, class_id)
);

create index if not exists exam_class_assignments_class_id_idx on public.exam_class_assignments (class_id);

comment on table public.exam_class_assignments is 'Đề từ kho exams được giao cho lớp; học viên chỉ thấy đề có bản ghi tới lớp của mình (hoặc đề không có bản ghi lớp nào + cờ assigned).';

alter table public.exam_class_assignments enable row level security;

drop policy if exists exam_class_assignments_select on public.exam_class_assignments;
create policy exam_class_assignments_select on public.exam_class_assignments
  for select using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = exam_class_assignments.class_id
        and c.teacher_id = (select auth.uid())
    )
    or exists (
      select 1 from public.class_enrollments ce
      where ce.class_id = exam_class_assignments.class_id
        and ce.student_id = (select auth.uid())
    )
  );

drop policy if exists exam_class_assignments_insert on public.exam_class_assignments;
create policy exam_class_assignments_insert on public.exam_class_assignments
  for insert with check (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = exam_class_assignments.class_id
        and c.teacher_id = (select auth.uid())
    )
  );

drop policy if exists exam_class_assignments_delete on public.exam_class_assignments;
create policy exam_class_assignments_delete on public.exam_class_assignments
  for delete using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = exam_class_assignments.class_id
        and c.teacher_id = (select auth.uid())
    )
  );
