-- 005_admins_profile.sql
ALTER TABLE IF EXISTS public.admins
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text;
