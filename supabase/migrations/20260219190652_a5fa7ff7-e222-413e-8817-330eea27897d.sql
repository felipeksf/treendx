
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule cron job to run every minute
SELECT cron.schedule(
  'process-report-emails',
  '* * * * *',
  $$SELECT public.process_report_emails()$$
);
