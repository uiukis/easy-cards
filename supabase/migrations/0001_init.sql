-- Roles: owner (dono), staff (equipe), customer (cliente)
create type user_role as enum ('owner', 'staff', 'customer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, new.phone, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper used inside RLS policies to check staff/owner role without recursive RLS.
create function is_staff(uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = uid and role in ('owner', 'staff')
  );
$$;

create table cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  set_name text,
  image_url text,
  description text,
  condition text,
  starting_price numeric(10, 2),
  status text not null default 'available' check (status in ('available', 'in_auction', 'sold')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete set null,
  customer_id uuid references profiles(id) on delete set null,
  card_name text not null,
  card_image_url text,
  price numeric(10, 2) not null,
  sale_type text not null default 'venda_direta' check (sale_type in ('leilao', 'venda_direta')),
  sold_at timestamptz not null default now(),
  notes text
);

create table supporters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instagram text,
  tier text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table event_settings (
  id boolean primary key default true check (id),
  title text not null default 'Oficina Pokémon TCG',
  event_date date,
  place text,
  tag text,
  banner_enabled boolean not null default true,
  banner_message text,
  form_url text,
  updated_at timestamptz not null default now()
);

insert into event_settings (id) values (true);

-- Row Level Security

alter table profiles enable row level security;
alter table cards enable row level security;
alter table sales enable row level security;
alter table supporters enable row level security;
alter table event_settings enable row level security;

create policy "profiles: self read" on profiles
  for select using (auth.uid() = id);

create policy "profiles: staff read all" on profiles
  for select using (is_staff(auth.uid()));

create policy "profiles: self update" on profiles
  for update using (auth.uid() = id);

create policy "cards: staff full access" on cards
  for all using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

create policy "sales: staff full access" on sales
  for all using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

create policy "sales: customer reads own" on sales
  for select using (auth.uid() = customer_id);

create policy "supporters: staff full access" on supporters
  for all using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

create policy "supporters: public read active" on supporters
  for select using (active = true);

create policy "event_settings: staff full access" on event_settings
  for all using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

create policy "event_settings: public read" on event_settings
  for select using (true);
