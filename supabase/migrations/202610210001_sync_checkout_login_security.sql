-- Echo SMP checkout + website login counter security synchronization.
-- This migration mirrors the live database changes already applied to project dkuffcpzmoyrkngojhab.
-- Server-side order creation remains responsible for catalog price validation and pending-only inserts.

CREATE UNIQUE INDEX IF NOT EXISTS sales_log_payment_reference_unique
  ON public.sales_log (payment_reference)
  WHERE payment_reference IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.sales_log'::regclass
      AND conname = 'sales_log_payment_method_check'
  ) THEN
    ALTER TABLE public.sales_log
      ADD CONSTRAINT sales_log_payment_method_check
      CHECK (payment_method IN ('upi', 'qr'));
  END IF;
END
$$;

-- The login counter function is SECURITY DEFINER and must only be callable by
-- the trusted server-side Edge Function using a secret key. Never expose it to
-- browser roles (anon/authenticated).
REVOKE ALL ON FUNCTION public.increment_website_login() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_website_login() FROM anon;
REVOKE ALL ON FUNCTION public.increment_website_login() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_website_login() TO service_role;
