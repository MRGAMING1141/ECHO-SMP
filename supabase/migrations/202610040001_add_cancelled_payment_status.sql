-- Allow customer cancellations before sales-team acceptance.
-- Existing states remain unchanged; "cancelled" is terminal.
ALTER TABLE public.sales_log
  DROP CONSTRAINT IF EXISTS sales_log_payment_status_check;

ALTER TABLE public.sales_log
  ADD CONSTRAINT sales_log_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'delivered', 'cancelled'));
