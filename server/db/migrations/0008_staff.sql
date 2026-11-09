-- The staff web page (LAUNCH-CHECKLIST stage 3 "หน้าเว็บของทีมงานแทนสคริปต์", brought forward by the owner on
-- 2026-11-09, docs/NOTES.md "หน้าเว็บของทีมงาน"): DriveGo's staff sign in with a password and a code from an
-- authenticator app (TOTP), then do on the web what tools/shop-admin.mjs does. It runs as an app of its own, at an
-- address of its own (.do/staff.yaml), and connects as drivego_staff: the app's rights on a shop's tables (still
-- through Row-Level Security, a shop at a time) plus opening shops and changing licences across shops. Never the
-- owner role: drivego_staff cannot change the schema, read the errors, nor remove a shop.

-- Staff accounts. Added, given a new temporary password, turned off and on only by the database owner
-- (tools/shop-admin.mjs staff …), never from the web page.
create table staff (
  id uuid primary key default gen_random_uuid(),
  login text not null unique check (login ~ '^[a-z0-9._-]{2,40}$'),
  name text not null check (name <> ''),
  password_hash text not null,          -- argon2id
  must_change boolean not null default true,   -- a temporary password: a new one before anything else
  totp_secret text,                     -- base32; null until the authenticator app is set up
  totp_pending text,                    -- shown while setting it up, until a first code matches
  totp_last_step bigint not null default 0,    -- the last code's 30-second step: a code works once
  active boolean not null default true,
  failed_logins timestamptz[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Signed-in browsers of the staff page; the cookie holds a random token, the table its SHA-256. stage 'password':
-- the password was right, the code (or a new password, or the app's set-up) is still to come.
create table staff_sessions (
  id_hash bytea primary key,
  staff_id uuid not null references staff (id) on delete cascade,
  stage text not null check (stage in ('password', 'full')),
  address text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index staff_sessions_staff on staff_sessions (staff_id);

-- What happened to staff accounts and their sign-ins (what staff do to shops goes to licence_log as before).
create table staff_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  login text not null,
  actor text not null,                  -- the account itself, or who ran tools/shop-admin.mjs (--by)
  action text not null,                 -- add | reset | off | on | signed-in | wrong-password | wrong-code | locked | password | app-set-up | signed-out
  address text not null default '',
  detail json not null default '{}'
);
create index staff_log_login on staff_log (login, id);

-- Only the owner role (the migrations, tools/shop-admin.mjs) and drivego_staff reach these: the shops' app has no
-- grant and no policy on them.
alter table staff enable row level security;           alter table staff force row level security;
alter table staff_sessions enable row level security;  alter table staff_sessions force row level security;
alter table staff_log enable row level security;       alter table staff_log force row level security;
do $$ begin
  execute format('create policy owner on staff to %I using (true) with check (true)', current_user);
  execute format('create policy owner on staff_sessions to %I using (true) with check (true)', current_user);
  execute format('create policy owner on staff_log to %I using (true) with check (true)', current_user);
end $$;

-- drivego_staff's rights. The role is made outside the migrations (DigitalOcean: by the staff app's database
-- component, or by hand in the control panel; a local run: tools/serve-new.mjs), so this runs after every migration
-- run (server/db/migrate.ts) and does nothing while the role does not exist. Every right of drivego_app on a table,
-- as it stands then (so a table added later follows), and these:
create function drivego_staff_grants() returns void language plpgsql set search_path = public as $$
declare r record;
begin
  if not exists (select from pg_roles where rolname = 'drivego_staff') then return; end if;
  if exists (select from pg_roles where rolname = 'drivego_staff' and (rolsuper or rolbypassrls)) then
    raise exception 'drivego_staff must not be a superuser or have BYPASSRLS';
  end if;
  grant usage on schema public to drivego_staff;
  for r in select c.relname, a.privilege_type from pg_class c cross join lateral aclexplode(c.relacl) a
            where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p', 'v') and a.grantee = 'drivego_app'::regrole loop
    execute format('grant %s on %I to drivego_staff', r.privilege_type, r.relname);
  end loop;
  grant execute on function app_shop(), app_branch_ok(text) to drivego_staff;
  -- Opening a shop (shop-open.ts) and every licence across shops (licence-admin.ts): listing, opening, renewing,
  -- postponing, closing, the contact, the notice. Not the removal of a shop's data, which stays the nightly job's.
  grant insert, update on shops to drivego_staff;
  grant select, insert, update on licences to drivego_staff;
  grant select, insert on licence_log to drivego_staff;
  grant select, insert, update, delete on staff, staff_sessions to drivego_staff;
  grant select, insert on staff_log to drivego_staff;
  if not exists (select from pg_policies where tablename = 'licences' and policyname = 'staff_page') then
    create policy staff_page on licences to drivego_staff using (true) with check (true);
    create policy staff_page on licence_log to drivego_staff using (true) with check (true);
    create policy staff_page on staff to drivego_staff using (true) with check (true);
    create policy staff_page on staff_sessions to drivego_staff using (true) with check (true);
    create policy staff_page on staff_log to drivego_staff using (true) with check (true);
    -- A failed request of the staff page is recorded like the app's (server/instrumentation.ts), never read back.
    create policy staff_page_adds on errors for insert to drivego_staff with check (true);
  end if;
end $$;
revoke execute on function drivego_staff_grants() from public;
