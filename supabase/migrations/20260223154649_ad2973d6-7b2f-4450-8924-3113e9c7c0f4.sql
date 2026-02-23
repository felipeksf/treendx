-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron job: 10h BRT (13:00 UTC) Mon-Fri
SELECT cron.schedule(
  'send-rate-email-morning',
  '0 13 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://khbkfcdpgrksrrpocdvb.supabase.co/functions/v1/send-rate-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYmtmY2RwZ3Jrc3JycG9jZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDE5OTIsImV4cCI6MjA4NjMxNzk5Mn0.AGdT0FZ0febeowddHGmL_u14CXBX7hQ2G_rVe775CxA"}'::jsonb,
    body := '{"period": "morning"}'::jsonb
  ) AS request_id;
  $$
);

-- Cron job: 17h BRT (20:00 UTC) Mon-Fri
SELECT cron.schedule(
  'send-rate-email-afternoon',
  '0 20 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://khbkfcdpgrksrrpocdvb.supabase.co/functions/v1/send-rate-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYmtmY2RwZ3Jrc3JycG9jZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDE5OTIsImV4cCI6MjA4NjMxNzk5Mn0.AGdT0FZ0febeowddHGmL_u14CXBX7hQ2G_rVe775CxA"}'::jsonb,
    body := '{"period": "afternoon"}'::jsonb
  ) AS request_id;
  $$
);