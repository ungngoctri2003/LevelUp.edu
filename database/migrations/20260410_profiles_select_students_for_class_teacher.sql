-- Cho phép giáo viên đọc profiles (tên, email) của học viên đã ghi danh lớp do chính họ phụ trách.
-- Cần cho roster, chấm điểm, và truy vấn batch profiles trong loadTeacherBundle.
-- (Trước đây chỉ có file database/rls_teacher_profiles_students.sql — nhiều project chưa chạy.)

drop policy if exists profiles_select_students_in_my_classes on public.profiles;

create policy profiles_select_students_in_my_classes on public.profiles
  for select using (
    exists (
      select 1
      from public.class_enrollments ce
      where ce.student_id = profiles.id
        and public.class_teacher_id(ce.class_id) = (select auth.uid())
    )
  );
