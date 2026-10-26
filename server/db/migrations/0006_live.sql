-- Every device sees the others' changes at once (task 3.10, decision Q8 and the
-- owner's answers 10.1–10.7 in docs/PHASE3-QUESTIONS.md). Each save already
-- writes one write_log row (who, which rows and their new versions); this
-- announces it on channel drivego_live when its transaction commits, so every
-- server process can tell the browsers of that shop (server/lib/live.ts, which
-- LISTENs). The payload names the shop, branch and row only: the process reads
-- the row itself, under Row-Level Security.
create function write_log_notify() returns trigger language plpgsql as $$
begin
  perform pg_notify('drivego_live', json_build_object('shop', new.shop_id, 'branch', new.branch_id, 'id', new.id)::text);
  return null;
end $$;

create trigger write_log_notify after insert on write_log for each row execute function write_log_notify();
