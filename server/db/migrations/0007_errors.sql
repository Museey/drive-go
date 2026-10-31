-- Errors of the server and of the browsers (LAUNCH-CHECKLIST stage 1 "แจ้งเตือนเมื่อระบบมีปัญหา"): every request
-- that failed on the server (server/instrumentation.ts) and every error a page did not catch (server/client/errors.ts,
-- /api/errors), kept ERROR_DAYS days (the nightly job removes older ones). Staff read them (tools/errors.mjs) and the
-- hourly job alerts on new ones (server/lib/watch.ts); a shop's are removed with its data (licence-admin.ts carryOut).
create table errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  source text not null check (source in ('server', 'browser')),
  shop_id uuid,                         -- the signed-in session's shop, if any
  user_id text,
  path text not null default '',        -- without the query string
  message text not null,
  detail text not null default '',      -- stack (cut)
  agent text not null default ''        -- the browser's user agent
);
create index errors_at on errors (at);

-- Up to where the hourly job has looked (name 'errors').
create table watch_marks (
  name text primary key,
  at timestamptz not null
);

-- The app adds errors and never reads them: no other shop's errors, nor its own, come back through the app. Staff
-- (the owner role that runs the migrations and the jobs) read and remove them.
alter table errors enable row level security;  alter table errors force row level security;
create policy app_adds on errors for insert to drivego_app with check (true);
do $$ begin
  execute format('create policy staff on errors to %I using (true) with check (true)', current_user);
end $$;
grant insert on errors to drivego_app;
