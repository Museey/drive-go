-- Task 3.11 (decision R19-ค, owner's answers 11.1–11.6): attachments (product
-- pictures, payment slips, received 50 ทวิ pictures, knowledge-library files
-- and clips) leave the shop's data. The data keeps a link (/api/files/<id>),
-- the file is kept here once per shop and branch, named by the SHA-256 of its
-- bytes. The shop logo stays inside the data (DB.shop.logo).
--
-- A file no longer referenced by the shop's data gets deleted_at; its bytes
-- go 30 days later (purge), but not while a backup point still refers to it
-- (11.6). Deleted files do not count towards the 2 GB of a shop or franchise
-- branch (11.2, 11.3). Staff restore one with tools/files.mjs (11.1).
create table files (
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  id text not null check (id ~ '^[0-9a-f]{64}$'),
  mime text not null,
  size bigint not null check (size >= 0),
  name text not null default '',
  -- evidence: payment slips and 50 ทวิ pictures, accepted even when the space is used up (11.2)
  use text not null check (use in ('evidence', 'picture', 'knowledge', 'other')),
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  restored_at timestamptz,
  primary key (shop_id, branch_id, id)
);
create index files_deleted on files (shop_id, branch_id, deleted_at) where deleted_at is not null;

-- The bytes, for the PostgreSQL file store (FILE_STORE=postgres: development,
-- tests, the pilot). Another store (S3-compatible, task 3.16) keeps them
-- elsewhere under <shop>/<branch>/<id>; the rows of files stay here.
create table file_bytes (
  shop_id uuid not null,
  branch_id text not null default '',
  id text not null,
  data bytea not null,
  primary key (shop_id, branch_id, id),
  foreign key (shop_id, branch_id, id) references files (shop_id, branch_id, id) on delete cascade
);

-- Which rows of the shop's data refer to which file (kept by every save,
-- server/lib/storage.ts writeMain). A link may name a file this branch does
-- not have (copied from another shop): no foreign key.
create table file_refs (
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  file_id text not null,
  unit text not null,
  key text not null,
  primary key (shop_id, branch_id, file_id, unit, key)
);
create index file_refs_row on file_refs (shop_id, branch_id, unit, key);

-- Files a backup point refers to (11.6): kept until the backup point goes.
create table backup_files (
  shop_id uuid not null,
  branch_id text not null default '',
  backup_key text not null,
  file_id text not null,
  primary key (shop_id, branch_id, backup_key, file_id),
  foreign key (shop_id, branch_id, backup_key) references backups (shop_id, branch_id, key) on delete cascade
);
create index backup_files_file on backup_files (shop_id, branch_id, file_id);

alter table files enable row level security;        alter table files force row level security;
alter table file_bytes enable row level security;   alter table file_bytes force row level security;
alter table file_refs enable row level security;    alter table file_refs force row level security;
alter table backup_files enable row level security; alter table backup_files force row level security;

create policy shop_only on files        using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on file_bytes   using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on file_refs    using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy shop_only on backup_files using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy branch_only on files        as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));
create policy branch_only on file_bytes   as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));
create policy branch_only on file_refs    as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));
create policy branch_only on backup_files as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));

grant select, insert, update, delete on files, file_bytes, file_refs, backup_files to drivego_app;
