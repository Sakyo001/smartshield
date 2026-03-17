-- Allow guest scans to be recorded without a signed-in account.
-- This makes extension_activity.user_id optional.
ALTER TABLE public.extension_activity
  ALTER COLUMN user_id DROP NOT NULL;
