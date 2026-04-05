-- Nội dung văn bản bài giảng lớp (giáo viên soạn, học viên xem qua API / trang chi tiết).
alter table public.teacher_lesson_posts
  add column if not exists body text;
