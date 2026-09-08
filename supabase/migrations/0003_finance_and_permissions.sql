-- Only the 3 admins (owner role) manage user permissions from now on.
drop policy "profiles: staff update all" on profiles;

create function is_owner(uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = uid and role = 'owner');
$$;

create policy "profiles: owner update all" on profiles
  for update using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

-- Values/prices move out of `cards` (staff-visible catalog) into a
-- separate, owner-only table. Staff can manage the catalog operationally
-- (name, image, condition, status) without ever seeing money.
alter table cards drop column if exists starting_price;
alter table cards add column tcg_api_id text;

create table card_finance (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade unique,
  starting_price numeric(10, 2),
  final_price numeric(10, 2),
  delivery_method text check (delivery_method in ('maos', 'dominaria')),
  dominaria_fee numeric(10, 2),
  buyer_id uuid references profiles(id),
  buyer_name text,
  sold_at timestamptz,
  notes text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

alter table card_finance enable row level security;

create policy "card_finance: owner full access" on card_finance
  for all using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

-- Drop the old sales table; card_finance replaces it (auction value +
-- final sale live on the same row now, so a card's whole money history
-- is one place instead of two).
drop table if exists sales;

-- "Quadro" of announcements (avisos), owner-managed, publicly readable.
create table announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

create policy "announcements: owner full access" on announcements
  for all using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

create policy "announcements: public read active" on announcements
  for select using (active = true);

-- Optional favorite Pokémon on a user's own profile.
alter table profiles add column favorite_pokemon text;

-- The "quadro" (event banner + supporters) is admin-only control, same as
-- announcements above -- not general staff.
drop policy "event_settings: staff full access" on event_settings;
create policy "event_settings: owner full access" on event_settings
  for all using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

drop policy "supporters: staff full access" on supporters;
create policy "supporters: owner full access" on supporters
  for all using (is_owner(auth.uid())) with check (is_owner(auth.uid()));
