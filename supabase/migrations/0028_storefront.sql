-- Public storefront ("vitrine"): cards the shop flags as available show on
-- /loja, but only while the shop-wide toggle is on. Easy Cards doesn't really
-- hold stock yet, so this stays off until turned on from the admin.

alter table cards add column if not exists in_stock boolean not null default false;
alter table cards add column if not exists price numeric; -- null => "consultar"

create policy "cards: public read in-stock" on cards
  for select using (in_stock = true);

-- Site-wide key/value settings. First key: shop_enabled.
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

create policy "site_settings: public read" on site_settings
  for select using (true);

create policy "site_settings: staff write" on site_settings
  for all using (has_permission(auth.uid(), 'manage_cards'))
  with check (has_permission(auth.uid(), 'manage_cards'));

insert into site_settings (key, value)
values ('shop_enabled', 'false'::jsonb)
on conflict (key) do nothing;
