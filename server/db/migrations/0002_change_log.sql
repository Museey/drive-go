-- Task 3.1 (decision R15): every change a save makes to a shop's records,
-- with the record as it was before and after, written in the same
-- transaction as the change. Kept 5 years; entries older than a year move to
-- cheaper storage (decision F10, task 3.16). The app may add entries and read
-- them, never change or remove them.
create table change_log (
  id bigint generated always as identity primary key,
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  at timestamptz not null default now(),
  user_id uuid,
  store_key text not null,
  unit text not null,
  key text not null,
  op text not null check (op in ('insert', 'update', 'delete')),
  version integer,            -- the record's version after the change; null once removed
  before json,                -- null for a new record
  after json                  -- null for a removed record
);
create index change_log_record on change_log (shop_id, branch_id, unit, key, id);
create index change_log_at on change_log (shop_id, at);

alter table change_log enable row level security;
alter table change_log force row level security;
create policy shop_only on change_log using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy branch_only on change_log as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));

grant select, insert on change_log to drivego_app;
