-- Bộ câu hỏi trắc nghiệm trên bài tập (cùng cấu trúc jsonb như public.exams.questions)
alter table public.assignments
  add column if not exists questions jsonb not null default '[]'::jsonb;

alter table public.assignment_submissions
  add column if not exists answers jsonb;
