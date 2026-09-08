-- Per-user binder display setting (grid size), kept separate from
-- binder_cards since it's one row per person, not per card.
create table binder_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  grid_size text not null default '3x3',
  updated_at timestamptz not null default now()
);

alter table binder_settings enable row level security;

create policy "binder_settings: owner full access" on binder_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
