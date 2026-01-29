-- Add avatar_url to preachers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'preachers' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.preachers ADD COLUMN avatar_url text;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END$$;
