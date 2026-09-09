-- A shared "what happened" feed for the team (one feed, not per-person).
-- Logged from triggers/RPCs: new signups, disputed purchases.

create table admin_activity (
  id uuid primary key default gen_random_uuid(),
  kind text not null,        -- signup | dispute | info
  title text not null,
  body text,
  link text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index admin_activity_created_idx on admin_activity (created_at desc);

alter table admin_activity enable row level security;
create policy "admin_activity: staff read" on admin_activity
  for select using (is_staff(auth.uid()));
create policy "admin_activity: staff update" on admin_activity
  for update using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- handle_new_user() and confirm_purchase() updated to insert here
-- (see 0033 / earlier for their prior definitions).
