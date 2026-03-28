-- Cho phép giáo viên đọc profile học sinh trong lớp của mình (roster, chấm điểm).
-- Chạy sau schema.sql nếu roster giáo viên cần tên/email từ profiles.

create policy profiles_select_students_in_my_classes on public.profiles
  for select using (
    exists (
      select 1
      from public.class_enrollments ce
      join public.classes c on c.id = ce.class_id
      where ce.student_id = profiles.id
        and c.teacher_id = (select auth.uid())
    )
  );
