-- Đề kiểm tra nhúng nội dung tương tác (Genially, v.v.) thay cho trắc nghiệm

alter table public.exams
  add column if not exists content_mode text not null default 'mcq',
  add column if not exists embed_src text;

alter table public.exams
  drop constraint if exists exams_content_mode_chk;

alter table public.exams
  add constraint exams_content_mode_chk check (content_mode in ('mcq', 'embed'));

comment on column public.exams.content_mode is 'mcq: bộ câu hỏi JSON; embed: iframe từ embed_src';
comment on column public.exams.embed_src is 'URL https được phép (ví dụ Genially view) để nhúng iframe';
