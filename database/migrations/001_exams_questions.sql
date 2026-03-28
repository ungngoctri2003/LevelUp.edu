-- Chạy một lần trên DB đã tạo từ schema cũ (chưa có cột questions).
alter table public.exams
  add column if not exists questions jsonb not null default '[]'::jsonb;
