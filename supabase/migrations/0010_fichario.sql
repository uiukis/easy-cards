-- Personal binder: any authenticated user (customer, staff, admin, cto) can
-- build their own showcase of cards, independent of the shop's own
-- inventory (cards table) -- it's their collection, not what's for sale.
create table binder_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tcg_api_id text,
  name text not null,
  set_name text,
  card_number text,
  image_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table binder_cards enable row level security;

create policy "binder_cards: owner full access" on binder_cards
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
