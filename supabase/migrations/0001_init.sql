-- PresentAI initial schema
-- Run via: supabase db push  (or paste into the SQL editor)

create extension if not exists "pgcrypto";

-- ---------- presentations ----------
create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  context text,
  target_duration_minutes int not null check (target_duration_minutes between 1 and 240),
  pdf_path text not null,
  slide_count int not null,
  slide_texts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists presentations_user_id_idx on public.presentations(user_id, created_at desc);

-- ---------- practice_sessions ----------
create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_duration_seconds int,
  transcript text,
  slide_timings jsonb not null default '[]'::jsonb,
  audio_path text,
  status text not null default 'in_progress' check (status in ('in_progress', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists practice_sessions_user_id_idx on public.practice_sessions(user_id, created_at desc);
create index if not exists practice_sessions_presentation_idx on public.practice_sessions(presentation_id, created_at desc);

-- ---------- ai_reports ----------
create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.practice_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  coverage jsonb,
  timing jsonb,
  delivery jsonb,
  structure jsonb,
  questions jsonb,
  overall_summary text,
  created_at timestamptz not null default now()
);

create index if not exists ai_reports_user_id_idx on public.ai_reports(user_id, created_at desc);

-- ---------- RLS ----------
alter table public.presentations enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.ai_reports enable row level security;

drop policy if exists "presentations: owner can do anything" on public.presentations;
create policy "presentations: owner can do anything" on public.presentations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sessions: owner can do anything" on public.practice_sessions;
create policy "sessions: owner can do anything" on public.practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reports: owner can do anything" on public.ai_reports;
create policy "reports: owner can do anything" on public.ai_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public)
values ('presentations', 'presentations', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- Storage RLS: users can manage objects in their own folder (path = "<uid>/...").
drop policy if exists "presentations storage: owner read" on storage.objects;
create policy "presentations storage: owner read" on storage.objects
  for select using (
    bucket_id = 'presentations'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "presentations storage: owner write" on storage.objects;
create policy "presentations storage: owner write" on storage.objects
  for insert with check (
    bucket_id = 'presentations'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "presentations storage: owner delete" on storage.objects;
create policy "presentations storage: owner delete" on storage.objects
  for delete using (
    bucket_id = 'presentations'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "recordings storage: owner read" on storage.objects;
create policy "recordings storage: owner read" on storage.objects
  for select using (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "recordings storage: owner write" on storage.objects;
create policy "recordings storage: owner write" on storage.objects
  for insert with check (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "recordings storage: owner delete" on storage.objects;
create policy "recordings storage: owner delete" on storage.objects
  for delete using (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
