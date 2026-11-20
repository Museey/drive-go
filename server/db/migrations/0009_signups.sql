-- Sign-ups from the website (the owner's request of 2026-11-20, docs/NOTES.md "ลงทะเบียนทดลองใช้จากหน้าเว็บ"): a garage
-- fills in the form of the landing page (/#contact, POST /api/signup), the request waits on the staff web page (/ops),
-- and staff open the shop from it (server/lib/signup.ts): the owner's user name and temporary password go to the
-- e-mail given. Kept, not removed (the owner's choice), with the consent given on the form.
create table signups (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  pkg text not null check (pkg in ('biz', 'prox', 'franchise')),
  name text not null check (name <> ''),             -- the garage's (or the chain's) name
  owner text not null check (owner <> ''),           -- the owner's first and last name
  tel text not null check (tel <> ''),
  email text not null check (email <> ''),
  tax_id text not null default '',
  addr text not null default '',
  zip text not null default '',
  note text not null default '',                     -- what the system should help with
  lang text not null default 'th' check (lang in ('th', 'en')),
  consent text not null,                             -- the consent text the person ticked, as shown
  address text not null default '',                  -- the sender's IP address
  agent text not null default '',
  status text not null default 'new' check (status in ('new', 'approved', 'rejected')),
  decided_at timestamptz,
  decided_by text,
  decision_note text not null default '',
  shop_code text,                                    -- the shop opened from it
  mailed_at timestamptz,                             -- when the sign-in e-mail went out
  mail_error text not null default ''
);
create index signups_status on signups (status, id);

-- The shops' app (drivego_app, the public form) adds new requests and reads nothing back; staff (drivego_staff, the
-- staff web page) read and decide; the owner role (migrations, tools) everything.
alter table signups enable row level security;  alter table signups force row level security;
create policy app_adds on signups for insert to drivego_app
  with check (status = 'new' and decided_at is null and decided_by is null and shop_code is null and mailed_at is null);
grant insert on signups to drivego_app;
do $$ begin
  execute format('create policy owner on signups to %I using (true) with check (true)', current_user);
end $$;

-- drivego_staff's rights (0008_staff.sql), now with the sign-ups.
create or replace function drivego_staff_grants() returns void language plpgsql set search_path = public as $$
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
  grant insert, update on shops to drivego_staff;
  grant select, insert, update on licences to drivego_staff;
  grant select, insert on licence_log to drivego_staff;
  grant select, insert, update, delete on staff, staff_sessions to drivego_staff;
  grant select, insert on staff_log to drivego_staff;
  grant select, update on signups to drivego_staff;
  if not exists (select from pg_policies where tablename = 'licences' and policyname = 'staff_page') then
    create policy staff_page on licences to drivego_staff using (true) with check (true);
    create policy staff_page on licence_log to drivego_staff using (true) with check (true);
    create policy staff_page on staff to drivego_staff using (true) with check (true);
    create policy staff_page on staff_sessions to drivego_staff using (true) with check (true);
    create policy staff_page on staff_log to drivego_staff using (true) with check (true);
    create policy staff_page_adds on errors for insert to drivego_staff with check (true);
  end if;
  if not exists (select from pg_policies where tablename = 'signups' and policyname = 'staff_page') then
    create policy staff_page on signups to drivego_staff using (true) with check (true);
  end if;
end $$;
revoke execute on function drivego_staff_grants() from public;
