-- How long each shop may use DriveGo (task 3.15, decision A2 and the owner's
-- answers 15.1–15.9 in docs/PHASE3-QUESTIONS.md). Kept by DriveGo's staff with
-- tools/shop-admin.mjs (the database owner); the web app may only read its own
-- shop's row and copies the dates into the shop's data for the screens
-- (server/lib/licence.ts).
--   kind       trial (60 days from opening) | pilot (pilot garages, 1 year) | paid
--   starts_on  first day; ends_on: last day the shop may change its data
--              (after it the shop is read-only, decision 15.3)
--   delete_on  when the shop's data is removed for good; null = ends_on + 90
--              days (15.5); staff may postpone it. A renewal clears it.
--   notice_sent_on  when the shop was told its data will be removed (30 days
--              before, 15.5); a renewal or a postponement clears it.
--   removed_on the day its data was removed; its change history (change_log)
--              is kept HISTORY_YEARS (5) more years, then the shop goes for good
--              (owner's answer 2026-10-26, as R15).
create table licences (
  shop_id uuid primary key references shops (id) on delete cascade,
  kind text not null check (kind in ('trial', 'pilot', 'paid')),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  delete_on date check (delete_on > ends_on),
  notice_sent_on date,
  contact text not null default '',     -- who to call or e-mail about renewal and removal
  removed_on date check (removed_on > ends_on),
  updated_at timestamptz not null default now()
);

-- A shop whose data was removed keeps its row (and its change history) until
-- the history's 5 years are over; nobody signs in to it.
alter table shops drop constraint shops_status_check;
alter table shops add constraint shops_status_check check (status in ('active', 'suspended', 'removed'));

-- Every action of the staff tools on a shop's licence, and every removal of a
-- shop's data. Not tied to shops: the record that a shop was removed outlives it.
create table licence_log (
  id bigint generated always as identity primary key,
  shop_id uuid not null,
  shop_code text not null,
  at timestamptz not null default now(),
  actor text not null,                  -- who ran the tool (operating system user, or --by)
  action text not null,                 -- open | renew | postpone | close | contact | notice | delete | purge
  detail json not null default '{}'
);
create index licence_log_shop on licence_log (shop_id, id);

-- Row-Level Security as on every table with a shop_id: the app role reads its
-- own shop's licence and nothing else (no grant on licence_log at all). The
-- staff tools connect as the owner that runs the migrations, and go across shops
-- (listing, the retention job): that role, and only it, has a policy of its own.
alter table licences enable row level security;     alter table licences force row level security;
alter table licence_log enable row level security;  alter table licence_log force row level security;
create policy shop_only on licences using (shop_id = app_shop());
create policy shop_only on licence_log using (shop_id = app_shop());
do $$ begin
  execute format('create policy staff on licences to %I using (true) with check (true)', current_user);
  execute format('create policy staff on licence_log to %I using (true) with check (true)', current_user);
end $$;

grant select on licences to drivego_app;
