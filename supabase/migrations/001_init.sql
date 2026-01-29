-- Create sessions table and simple RLS policy for authenticated users
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration integer,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.sessions enable row level security;

DO $$
BEGIN
  CREATE POLICY "Insert own sessions" ON public.sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  -- policy already exists
  NULL;
END$$;

-- Allow owners to select
DO $$
BEGIN
  CREATE POLICY "Select own sessions" ON public.sessions
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;

-- Allow owners to update their sessions
DO $$
BEGIN
  CREATE POLICY "Update own sessions" ON public.sessions
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  NULL;
END$$;
