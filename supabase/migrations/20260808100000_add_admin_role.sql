-- ================================================================
-- Add is_admin column to profiles.
--
-- After running this migration, set the first admin:
--   UPDATE public.profiles SET is_admin = true WHERE username = 'your_username';
-- ================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Partial index — very few admins, so this stays tiny
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx
  ON public.profiles (id)
  WHERE is_admin = true;
