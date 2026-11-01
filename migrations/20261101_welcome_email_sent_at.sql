-- Track whether a user's welcome email has gone out.
--
-- The welcome email used to be sent straight after sign-up, which only
-- worked when sign-up returned a session. With email confirmation on it
-- doesn't, so new users never got it. It is now sent on the first sign-in
-- with a confirmed email, and /api/send-email claims this column so each
-- account gets it at most once.
--
-- Accounts that exist when the column is created are marked as already
-- sent, so nobody who signed up before this change gets a surprise welcome
-- email. The backfill only runs when the column is first added: re-running
-- this file must not mark newer, still-unwelcomed users as sent.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'welcome_email_sent_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN welcome_email_sent_at timestamptz;
    UPDATE public.profiles SET welcome_email_sent_at = now();
  END IF;
END $$;
