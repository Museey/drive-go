-- Task 3.2 (decisions R1, A7, F1): the last document number issued from each
-- counter of a shop (branch × type × month: 'MA-SA2610' …). The app's own
-- copy of its counters (DB.seq rows in records) follows this one; this one is
-- never lowered and never removed, not even with the app's data, so wiping
-- the data or restoring an older backup never issues a number twice. Each
-- save locks the counters it uses (server/lib/storage.ts issueNumbers).
create table doc_counters (
  shop_id uuid not null references shops (id) on delete cascade,
  branch_id text not null default '',
  base text not null,
  last integer not null check (last >= 0),
  primary key (shop_id, branch_id, base)
);

create function doc_counters_never_lower() returns trigger language plpgsql as $$
begin
  if new.last < old.last then
    raise exception 'document counter % of shop % cannot go back from % to %', old.base, old.shop_id, old.last, new.last;
  end if;
  return new;
end $$;
create trigger never_lower before update on doc_counters for each row execute function doc_counters_never_lower();

alter table doc_counters enable row level security;
alter table doc_counters force row level security;
create policy shop_only on doc_counters using (shop_id = app_shop()) with check (shop_id = app_shop());
create policy branch_only on doc_counters as restrictive using (app_branch_ok(branch_id)) with check (app_branch_ok(branch_id));

grant select, insert, update on doc_counters to drivego_app;
