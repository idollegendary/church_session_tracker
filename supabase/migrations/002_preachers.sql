-- Create preachers table
create table if not exists public.preachers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Add preacher_id to sessions (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'preacher_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN preacher_id uuid;
  END IF;
EXCEPTION WHEN others THEN
  -- ignore
  NULL;
END$$;

-- Add foreign key constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'sessions_preacher_fk' AND t.relname = 'sessions'
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_preacher_fk FOREIGN KEY (preacher_id) REFERENCES public.preachers(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END$$;

-- Enable RLS on preachers and allow select for authenticated
alter table public.preachers enable row level security;
create policy "Select preachers" on public.preachers
  for select using (auth.role() = 'authenticated');
