
-- Link YouTube (URL gốc hoặc dạng embed) để hiển thị video trên trang chi tiết bài giảng công khai.
alter table public.lesson_details add column if not exists youtube_url text;

comment on column public.lesson_details.youtube_url is 'URL YouTube (watch, youtu.be hoặc embed) — hiển thị iframe trên /bai-giang/:id';
