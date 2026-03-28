-- LevelUp.edu — Supabase / PostgreSQL schema
-- Aligns with supabase-postgres-best-practices: identity PKs, FK indexes, RLS (auth.uid() wrapped),
-- partial indexes, timestamptz/text, lowercase snake_case, security definer helpers.
--
-- Apply: Supabase Dashboard → SQL Editor (postgres) → paste & run on a fresh project,
--   or: supabase db push / psql against your instance.
--
-- Prereq: Supabase Auth enabled. Tables in public schema reference auth.users via public.profiles.

-- ---------------------------------------------------------------------------
-- Enums (app string unions; lowercase values)
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.account_status as enum ('active', 'inactive', 'suspended', 'pending');
create type public.student_status as enum ('active', 'inactive', 'trial');
create type public.student_source as enum ('registered', 'manual');
create type public.teacher_approval_status as enum ('approved', 'pending', 'suspended');
create type public.admission_status as enum ('new', 'reviewing', 'accepted', 'rejected');
create type public.admin_activity_type as enum ('admin', 'course', 'system', 'user', 'support');
create type public.grading_status as enum ('pending', 'graded');

-- ---------------------------------------------------------------------------
-- Security definer helpers (RLS: avoid per-row re-eval where possible; indexed columns)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'teacher'
  );
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users) — UUID PK matches auth (Supabase pattern)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text not null,
  full_name         text not null,
  phone             text,
  role              public.user_role not null default 'student',
  account_status    public.account_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);
create index profiles_account_status_idx on public.profiles (account_status);

create table public.student_profiles (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  grade_label       text,
  status            public.student_status not null default 'active',
  source            public.student_source not null default 'registered',
  joined_at         date not null default current_date,
  external_ref      text
);

create index student_profiles_status_idx on public.student_profiles (status);

create table public.teacher_profiles (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  subjects_summary  text,
  approval_status   public.teacher_approval_status not null default 'pending',
  class_count_cache integer not null default 0
);

create index teacher_profiles_approval_idx on public.teacher_profiles (approval_status);

-- ---------------------------------------------------------------------------
-- Catalog (bigint identity — better insert locality than random uuid)
-- ---------------------------------------------------------------------------
create table public.subjects (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  icon_label  text,
  sort_order  integer not null default 0
);

create table public.courses (
  id           bigint generated always as identity primary key,
  subject_id   bigint references public.subjects (id) on delete set null,
  title        text not null,
  description  text,
  visible      boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index courses_subject_id_idx on public.courses (subject_id);
-- Partial: list public catalog (matches typical where visible = true)
create index courses_visible_list_idx on public.courses (sort_order, id) where visible = true;

create table public.lessons (
  id               bigint generated always as identity primary key,
  subject_id       bigint not null references public.subjects (id) on delete cascade,
  title            text not null,
  duration_minutes integer,
  level_label      text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index lessons_subject_id_idx on public.lessons (subject_id);

create table public.lesson_details (
  lesson_id      bigint primary key references public.lessons (id) on delete cascade,
  summary        text,
  teacher_name   text,
  outline        jsonb not null default '[]'::jsonb,
  sections       jsonb not null default '[]'::jsonb,
  resources      jsonb not null default '[]'::jsonb,
  practice_hints jsonb not null default '[]'::jsonb
);

-- Optional: enable if you query JSON paths (see skill advanced-jsonb-indexing)
-- create index lesson_details_outline_gin_idx on public.lesson_details using gin (outline jsonb_path_ops);

create table public.exams (
  id               bigint generated always as identity primary key,
  title            text not null,
  subject_label    text not null,
  duration_minutes integer not null,
  question_count   integer not null default 0,
  questions        jsonb not null default '[]'::jsonb,
  level_label      text,
  published        boolean not null default true,
  assigned         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index exams_published_list_idx on public.exams (subject_label, id) where published = true;

create table public.exam_attempts (
  id             bigint generated always as identity primary key,
  student_id     uuid not null references public.profiles (id) on delete cascade,
  exam_id        bigint not null references public.exams (id) on delete cascade,
  score          numeric(6, 2) not null,
  max_score      numeric(6, 2) not null,
  correct_count  integer,
  total_count    integer,
  completed_at   timestamptz not null default now(),
  constraint chk_exam_attempts_score_range check (
    max_score > 0 and score >= 0 and score <= max_score
  ),
  constraint chk_exam_attempts_counts check (
    (correct_count is null and total_count is null)
    or (
      correct_count is not null
      and total_count is not null
      and correct_count >= 0
      and total_count > 0
      and correct_count <= total_count
    )
  )
);

create index exam_attempts_student_completed_idx on public.exam_attempts (student_id, completed_at desc);
create index exam_attempts_exam_id_idx on public.exam_attempts (exam_id);

create table public.news_posts (
  id            bigint generated always as identity primary key,
  title         text not null,
  excerpt       text,
  body          text,
  category      text,
  published_on  date not null default current_date,
  slug          text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index news_posts_published_on_idx on public.news_posts (published_on desc);

create table public.admission_applications (
  id             bigint generated always as identity primary key,
  student_name   text not null,
  parent_phone   text not null,
  grade_label    text not null,
  status         public.admission_status not null default 'new',
  submitted_at   timestamptz not null default now(),
  notes          text
);

create index admission_applications_status_idx on public.admission_applications (status);
create index admission_applications_submitted_idx on public.admission_applications (submitted_at desc);

create table public.marketing_leads (
  id               bigint generated always as identity primary key,
  full_name        text not null,
  email            text not null,
  phone            text not null,
  course_interest  text,
  created_at       timestamptz not null default now()
);

create index marketing_leads_created_at_idx on public.marketing_leads (created_at desc);

create table public.admin_activity_logs (
  id              bigint generated always as identity primary key,
  occurred_at     timestamptz not null default now(),
  actor_email     text,
  action          text not null,
  type            public.admin_activity_type not null default 'admin',
  actor_user_id   uuid references public.profiles (id) on delete set null
);

create index admin_activity_logs_occurred_idx on public.admin_activity_logs (occurred_at desc);
create index admin_activity_logs_actor_user_idx on public.admin_activity_logs (actor_user_id);

create table public.system_settings (
  key   text primary key,
  value jsonb not null
);

create table public.classes (
  id               bigint generated always as identity primary key,
  code             text unique,
  name             text not null,
  subject          text not null,
  grade_label      text not null,
  schedule_summary text,
  teacher_id       uuid not null references public.profiles (id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index classes_teacher_id_idx on public.classes (teacher_id);

create table public.class_enrollments (
  class_id       bigint not null references public.classes (id) on delete cascade,
  student_id     uuid not null references public.profiles (id) on delete cascade,
  enrolled_at    timestamptz not null default now(),
  avg_score      numeric(4, 2),
  attendance_pct numeric(5, 2),
  primary key (class_id, student_id),
  constraint chk_class_enrollments_attendance_pct check (
    attendance_pct is null
    or (attendance_pct >= 0 and attendance_pct <= 100)
  )
);

create index class_enrollments_student_id_idx on public.class_enrollments (student_id);

create table public.teacher_lesson_posts (
  id               bigint generated always as identity primary key,
  class_id         bigint not null references public.classes (id) on delete cascade,
  title            text not null,
  duration_display text,
  view_count       integer not null default 0,
  updated_at       timestamptz not null default now(),
  constraint chk_teacher_lesson_posts_view_count check (view_count >= 0)
);

create index teacher_lesson_posts_class_id_idx on public.teacher_lesson_posts (class_id);

create table public.schedule_slots (
  id          bigint generated always as identity primary key,
  class_id    bigint not null references public.classes (id) on delete cascade,
  day_label   text not null,
  time_range  text not null,
  room        text
);

create index schedule_slots_class_id_idx on public.schedule_slots (class_id);

create table public.assignments (
  id               bigint generated always as identity primary key,
  class_id         bigint not null references public.classes (id) on delete cascade,
  title            text not null,
  due_at           timestamptz,
  submitted_count  integer not null default 0,
  total_students   integer not null default 0,
  created_at       timestamptz not null default now(),
  constraint chk_assignments_counts_nonneg check (
    submitted_count >= 0 and total_students >= 0
  )
);

create index assignments_class_id_idx on public.assignments (class_id);

create table public.assignment_submissions (
  id             bigint generated always as identity primary key,
  assignment_id  bigint not null references public.assignments (id) on delete cascade,
  student_id     uuid not null references public.profiles (id) on delete cascade,
  submitted_at   timestamptz not null default now(),
  score          numeric(4, 2),
  status         public.grading_status not null default 'pending',
  unique (assignment_id, student_id)
);

create index assignment_submissions_assignment_id_idx on public.assignment_submissions (assignment_id);
create index assignment_submissions_student_id_idx on public.assignment_submissions (student_id);
-- Partial: grading queue
create index assignment_submissions_pending_idx
  on public.assignment_submissions (assignment_id, submitted_at)
  where status = 'pending';

create table public.student_course_progress (
  student_id   uuid not null references public.profiles (id) on delete cascade,
  course_id    bigint not null references public.courses (id) on delete cascade,
  progress_pct numeric(5, 2) not null default 0,
  note         text,
  updated_at   timestamptz not null default now(),
  primary key (student_id, course_id),
  constraint chk_student_course_progress_pct check (
    progress_pct >= 0 and progress_pct <= 100
  )
);

create table public.public_teacher_profiles (
  id           bigint generated always as identity primary key,
  user_id      uuid unique references public.profiles (id) on delete set null,
  name         text not null,
  bio          text,
  initial      text,
  color_token  text,
  sort_order   integer not null default 0
);

create index public_teacher_profiles_sort_idx on public.public_teacher_profiles (sort_order);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

create trigger exams_set_updated_at
  before update on public.exams
  for each row execute function public.set_updated_at();

create trigger news_posts_set_updated_at
  before update on public.news_posts
  for each row execute function public.set_updated_at();

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

create trigger teacher_lesson_posts_set_updated_at
  before update on public.teacher_lesson_posts
  for each row execute function public.set_updated_at();

create trigger student_course_progress_set_updated_at
  before update on public.student_course_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New Auth user → public.profiles (default role student; promote via admin)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, account_status)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1),
      'User'
    ),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    'student',
    'active'
  );
  insert into public.student_profiles (user_id, status, source)
  values (new.id, 'active', 'registered');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent clients from escalating role / account_status without admin (RLS + trigger)
create or replace function public.profiles_enforce_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip when no JWT (e.g. SQL Editor / maintenance) so admins can fix data with postgres role
  if (select auth.uid()) is null then
    return new;
  end if;
  if (
    new.role is distinct from old.role
    or new.account_status is distinct from old.account_status
  ) and not (select public.is_admin()) then
    raise exception 'Only admin can change role or account_status';
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_privileged_fields
  before update on public.profiles
  for each row execute function public.profiles_enforce_privileged_fields();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_details enable row level security;
alter table public.exams enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.news_posts enable row level security;
alter table public.admission_applications enable row level security;
alter table public.marketing_leads enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.teacher_lesson_posts enable row level security;
alter table public.schedule_slots enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.student_course_progress enable row level security;
alter table public.public_teacher_profiles enable row level security;

-- profiles
create policy profiles_select_own_or_admin on public.profiles
  for select using (
    id = (select auth.uid()) or (select public.is_admin())
  );
create policy profiles_update_own_or_admin on public.profiles
  for update using (
    id = (select auth.uid()) or (select public.is_admin())
  )
  with check (
    id = (select auth.uid()) or (select public.is_admin())
  );

-- student / teacher profiles
create policy student_profiles_select on public.student_profiles
  for select using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.class_enrollments ce
      join public.classes c on c.id = ce.class_id
      where ce.student_id = public.student_profiles.user_id
        and c.teacher_id = (select auth.uid())
    )
  );
create policy student_profiles_insert_own on public.student_profiles
  for insert with check (user_id = (select auth.uid()));
create policy student_profiles_update_own on public.student_profiles
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy student_profiles_modify_admin on public.student_profiles
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy teacher_profiles_select on public.teacher_profiles
  for select using (
    user_id = (select auth.uid()) or (select public.is_admin())
  );
create policy teacher_profiles_modify_admin on public.teacher_profiles
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- catalog: public read for visible; admin all
create policy subjects_select_public on public.subjects for select using (true);
create policy subjects_write_admin on public.subjects
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy courses_select_public on public.courses
  for select using (visible = true or (select public.is_admin()));
create policy courses_write_admin on public.courses
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy lessons_select_public on public.lessons for select using (true);
create policy lessons_write_admin on public.lessons
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy lesson_details_select_public on public.lesson_details for select using (true);
create policy lesson_details_write_admin on public.lesson_details
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy exams_select_public on public.exams
  for select using (published = true or (select public.is_admin()));
create policy exams_write_admin on public.exams
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- attempts: own or admin
create policy exam_attempts_select on public.exam_attempts
  for select using (
    student_id = (select auth.uid()) or (select public.is_admin())
  );
create policy exam_attempts_insert_own on public.exam_attempts
  for insert with check (student_id = (select auth.uid()));
create policy exam_attempts_update_own on public.exam_attempts
  for update using (
    student_id = (select auth.uid()) or (select public.is_admin())
  )
  with check (
    student_id = (select auth.uid()) or (select public.is_admin())
  );

-- news: public read; admin write
create policy news_select_public on public.news_posts for select using (true);
create policy news_write_admin on public.news_posts
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- admissions: admin only (adjust if you add counselor role)
create policy admissions_admin on public.admission_applications
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- marketing: anyone can insert; admin reads
create policy marketing_leads_insert on public.marketing_leads
  for insert to anon, authenticated with check (true);
create policy marketing_leads_select_admin on public.marketing_leads
  for select using ((select public.is_admin()));

-- admin logs & settings: admin only
create policy admin_activity_logs_admin on public.admin_activity_logs
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create policy system_settings_admin on public.system_settings
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- classes: teacher owns or admin
create policy classes_select on public.classes
  for select using (
    teacher_id = (select auth.uid()) or (select public.is_admin())
    or exists (
      select 1 from public.class_enrollments ce
      where ce.class_id = public.classes.id
        and ce.student_id = (select auth.uid())
    )
  );
create policy classes_modify_teacher_or_admin on public.classes
  for all using (
    teacher_id = (select auth.uid()) or (select public.is_admin())
  )
  with check (
    teacher_id = (select auth.uid()) or (select public.is_admin())
  );

-- enrollments: student sees own; teacher of class; admin
create policy class_enrollments_select on public.class_enrollments
  for select using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.class_enrollments.class_id
        and c.teacher_id = (select auth.uid())
    )
  );
create policy class_enrollments_modify_teacher_or_admin on public.class_enrollments
  for all using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.class_enrollments.class_id
        and c.teacher_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.class_enrollments.class_id
        and c.teacher_id = (select auth.uid())
    )
  );

create policy teacher_lesson_posts_select on public.teacher_lesson_posts
  for select using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.teacher_lesson_posts.class_id
        and c.teacher_id = (select auth.uid())
    )
    or exists (
      select 1 from public.class_enrollments ce
      where ce.class_id = public.teacher_lesson_posts.class_id
        and ce.student_id = (select auth.uid())
    )
  );
create policy teacher_lesson_posts_modify_teacher_or_admin on public.teacher_lesson_posts
  for all using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.teacher_lesson_posts.class_id
        and c.teacher_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.teacher_lesson_posts.class_id
        and c.teacher_id = (select auth.uid())
    )
  );

create policy schedule_slots_select on public.schedule_slots
  for select using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.schedule_slots.class_id
        and c.teacher_id = (select auth.uid())
    )
    or exists (
      select 1 from public.class_enrollments ce
      where ce.class_id = public.schedule_slots.class_id
        and ce.student_id = (select auth.uid())
    )
  );
create policy schedule_slots_modify_teacher_or_admin on public.schedule_slots
  for all using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.schedule_slots.class_id
        and c.teacher_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.schedule_slots.class_id
        and c.teacher_id = (select auth.uid())
    )
  );

create policy assignments_select on public.assignments
  for select using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.assignments.class_id
        and c.teacher_id = (select auth.uid())
    )
    or exists (
      select 1 from public.class_enrollments ce
      where ce.class_id = public.assignments.class_id
        and ce.student_id = (select auth.uid())
    )
  );
create policy assignments_modify_teacher_or_admin on public.assignments
  for all using (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.assignments.class_id
        and c.teacher_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_admin())
    or exists (
      select 1 from public.classes c
      where c.id = public.assignments.class_id
        and c.teacher_id = (select auth.uid())
    )
  );

create policy assignment_submissions_select on public.assignment_submissions
  for select using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.assignments a
      join public.classes c on c.id = a.class_id
      where a.id = public.assignment_submissions.assignment_id
        and c.teacher_id = (select auth.uid())
    )
  );
create policy assignment_submissions_insert_own on public.assignment_submissions
  for insert with check (
    student_id = (select auth.uid())
    or (select public.is_admin())
  );
create policy assignment_submissions_update on public.assignment_submissions
  for update using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.assignments a
      join public.classes c on c.id = a.class_id
      where a.id = public.assignment_submissions.assignment_id
        and c.teacher_id = (select auth.uid())
    )
  )
  with check (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.assignments a
      join public.classes c on c.id = a.class_id
      where a.id = public.assignment_submissions.assignment_id
        and c.teacher_id = (select auth.uid())
    )
  );

create policy student_course_progress_select on public.student_course_progress
  for select using (
    student_id = (select auth.uid()) or (select public.is_admin())
  );
create policy student_course_progress_modify_own_or_admin on public.student_course_progress
  for all using (
    student_id = (select auth.uid()) or (select public.is_admin())
  )
  with check (
    student_id = (select auth.uid()) or (select public.is_admin())
  );

create policy public_teacher_profiles_select on public.public_teacher_profiles for select using (true);
create policy public_teacher_profiles_write_admin on public.public_teacher_profiles
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Grants (API roles): RLS still applies — least privilege baseline
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- anon: RLS still applies — needed so unauthenticated site can read published catalog/news
grant select on all tables in schema public to anon;
grant insert on public.marketing_leads to anon;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;

-- service_role bypasses RLS in Supabase (server-side only — never expose service key in browser)
