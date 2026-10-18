-- Core tables of the new system (docs/PHASE2-DESIGN.md §3) and Row-Level
-- Security: every row of a shop carries shop_id, and the app's role can only
-- reach rows of the shop (and branch) set for the current transaction:
--   select set_config('app.shop_id', $1, true), set_config('app.branch_scope', $2, true)
-- app.branch_scope: '' = Biz/ProX (one data set), '*' = franchise HQ (all
-- branches), 'B001' … = one franchise branch. Unset settings raise an error,
-- so a forgotten setting fails closed instead of showing every shop.

-- The role the web app connects as. Never a superuser and never BYPASSRLS:
-- either would skip every policy below.
do $$ begin
  if not exists (select from pg_roles where rolname = 'drivego_app') then
    create role drivego_app login;
  end if;
  if exists (select from pg_roles where rolname = 'drivego_app' and (rolsuper or rolbypassrls)) then
    raise exception 'drivego_app must not be a superuser or have BYPASSRLS';
  end if;
end $$;

create function app_shop() returns uuid language sql stable
  as $$ select current_setting('app.shop_id')::uuid $$;

create function app_branch_ok(branch text) returns boolean language sql stable
  as $$ select current_setting('app.branch_scope') = '*' or branch = '' or branch = current_setting('app.branch_scope') $$;

-- One row per garage (a franchise chain is one shop). Opened by an admin
-- script (decision P3); the app may only read it.
create table shops (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9][A-Za-z0-9-]{1,31}$'),
  package text not null check (package in ('biz', 'prox', 'franchise')),
  name text not null default '',
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

-- Accounts that can sign in: the shop owner (DGB.shop), employees (DB.emp)
-- and franchise accounts (FR.accounts). ref = the id in the legacy data.
create table users (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  kind text not null check (kind in ('owner', 'emp', 'fr')),
  ref text not null default '',
  role text not null default '',
  password_hash text,
  pin_hash text,
  active boolean not null default true,
  failed_logins timestamptz[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, kind, ref)
);

-- Names a user signs in with (user name, e-mail, phone; normalised).
-- Unique within a shop (decision A5).
create table logins (
  shop_id uuid not null references shops (id) on delete cascade,
  login text not null,
  user_id uuid not null references users (id) on delete cascade,
  primary key (shop_id, login)
);

-- Signed-in browsers. Only a hash of the token is kept. state holds what the
-- legacy app kept per signed-in person (DB.curEmp, DGB.session, FR.session).
create table sessions (
  id_hash bytea primary key,
  shop_id uuid not null references shops (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  branch_scope text not null,
  state json not null default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);
create index sessions_user on sessions (user_id);

-- The shop's data, one row per unit (one receipt, one customer, one counter
-- of DB.seq …). data is json, not jsonb: json keeps the text as written, so
-- the order of keys inside each record survives (the legacy code iterates
-- objects in key order). pos orders the records of a unit.
create table records (
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  unit text not null,
  key text not null,
  pos bigint not null,
  data json not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (shop_id, branch_id, unit, key)
);
create index records_unit_pos on records (shop_id, branch_id, unit, pos);

-- Decision P2: no two documents of one kind share a number within a shop's
-- branch (franchise branches still count separately until decision A7).
create unique index records_doc_no on records (shop_id, branch_id, unit, (data ->> 'no'))
  where unit in ('DB.receipts', 'DB.quotes', 'DB.stockCuts', 'DB.purchases', 'DB.expenses', 'DB.assets', 'DB.claims',
                 'DB.invoices', 'DB.billings', 'DB.issues', 'DB.stockCounts', 'DB.warns', 'DB.transfers')
    and coalesce(data ->> 'no', '') <> '';
create unique index records_tax_no on records (shop_id, branch_id, (data ->> 'taxNo'))
  where unit = 'DB.receipts' and coalesce(data ->> 'taxNo', '') <> '';

-- Other keys the legacy STORE keeps (dgb.guide.v22 …), stored as they are.
create table blobs (
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (shop_id, branch_id, key)
);

-- Backup points shown in menu 10 (garage.v22.bak.<day> …): the whole data
-- set, gzip.
create table backups (
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  key text not null,
  data bytea not null,
  created_at timestamptz not null default now(),
  primary key (shop_id, branch_id, key)
);

-- Every accepted save: who changed which units to which version.
create table write_log (
  id bigint generated always as identity primary key,
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  user_id uuid,
  at timestamptz not null default now(),
  units json not null
);
create index write_log_shop on write_log (shop_id, id);

-- Row-Level Security. FORCE makes the policies apply to the tables' owner
-- too; only superusers (never the app) skip them.
alter table users enable row level security;      alter table users force row level security;
alter table logins enable row level security;     alter table logins force row level security;
-- sessions is not FORCEd: session_lookup() below runs as the tables' owner
-- and must reach a session before the shop is known.
alter table sessions enable row level security;
alter table records enable row level security;    alter table records force row level security;
alter table blobs enable row level security;      alter table blobs force row level security;
alter table backups enable row level security;    alter table backups force row level security;
alter table write_log enable row level security;  alter table write_log force row level security;

create policy shop_only on users     using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on logins    using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on sessions  using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on records   using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on blobs     using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on backups   using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on write_log using (shop_id = app_shop()) with check (shop_id = app_shop());

create policy branch_only on users     as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));
create policy branch_only on records   as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));
create policy branch_only on blobs     as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));
create policy branch_only on backups   as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));
create policy branch_only on write_log as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));

-- A request carries only its session cookie, so the session is found before
-- the shop is known. This is the one way around the shop policy, and it
-- returns only an unexpired session for the exact token hash.
create function session_lookup(token_hash bytea)
  returns table (shop_id uuid, user_id uuid, branch_scope text, state json, expires_at timestamptz)
  language sql stable security definer set search_path = public
  as $$ select s.shop_id, s.user_id, s.branch_scope, s.state, s.expires_at
        from sessions s where s.id_hash = token_hash and s.expires_at > now() $$;
revoke all on function session_lookup(bytea) from public;

grant usage on schema public to drivego_app;
grant select on shops to drivego_app;
grant select, insert, update, delete on users, logins, sessions, records, blobs, backups, write_log to drivego_app;
grant execute on function app_shop(), app_branch_ok(text), session_lookup(bytea) to drivego_app;
