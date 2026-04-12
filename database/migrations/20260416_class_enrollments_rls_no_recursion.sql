-- Sửa policy chat: tránh đệ quy RLS (42P17) khi policy đọc lại class_enrollments.
-- Chạy nếu đã áp dụng bản 20260415 với EXISTS vào class_enrollments.

drop policy if exists class_enrollments_select_peers_same_class on public.class_enrollments;
create policy class_enrollments_select_peers_same_class on public.class_enrollments
  for select using (
    public.student_enrolled_in_class(class_id)
  );
