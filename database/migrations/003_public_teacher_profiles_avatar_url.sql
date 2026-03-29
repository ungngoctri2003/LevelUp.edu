-- Bổ sung avatar_url nếu bảng được tạo từ bản schema cũ thiếu cột (public API / admin landing).
alter table public.public_teacher_profiles
  add column if not exists avatar_url text;
