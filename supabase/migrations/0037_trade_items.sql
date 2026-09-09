-- "Tenho pra troca": cards a person offers. Mirrors wishlist_items. Shows on
-- the public profile alongside the wishlist, and powers trade_matches().

create table trade_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tcg_api_id text,
  name text not null,
  set_name text,
  card_number text,
  image_url text not null,
  rarity text,
  condition text,
  note text,
  created_at timestamptz not null default now()
);

create index trade_items_user_idx on trade_items (user_id);
create index trade_items_name_idx on trade_items (lower(name));

alter table trade_items enable row level security;
create policy "trade: owner full access" on trade_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "trade: public read when profile shared" on trade_items
  for select using (
    exists (select 1 from profiles p where p.id = trade_items.user_id and p.wishlist_public = true)
  );
create policy "trade: staff with permission" on trade_items
  for select using (has_permission(auth.uid(), 'view_wishlists'));

-- public_wishlist() extended to also return `trades`.
create or replace function public.public_wishlist(p_slug text)
returns json language sql stable security definer set search_path to 'public' as $$
  select case when p.id is null then null else json_build_object(
    'name', case when p.verified_at is not null then p.full_name
                 else split_part(coalesce(p.full_name, ''), ' ', 1) end,
    'username', p.username,
    'verified', p.verified_at is not null,
    'email_confirmed', (select u.email_confirmed_at is not null from auth.users u where u.id = p.id),
    'avatar', p.favorite_pokemon_sprite,
    'pokemon', p.favorite_pokemon,
    'items', coalesce((select json_agg(json_build_object(
        'id', w.id, 'name', w.name, 'set_name', w.set_name, 'card_number', w.card_number,
        'image_url', w.image_url, 'rarity', w.rarity, 'priority', w.priority, 'note', w.note)
      order by w.priority, w.created_at)
      from wishlist_items w where w.user_id = p.id and w.acquired = false), '[]'::json),
    'trades', coalesce((select json_agg(json_build_object(
        'id', t.id, 'name', t.name, 'set_name', t.set_name, 'card_number', t.card_number,
        'image_url', t.image_url, 'rarity', t.rarity, 'condition', t.condition, 'note', t.note)
      order by t.created_at desc)
      from trade_items t where t.user_id = p.id), '[]'::json)
  ) end
  from (select id, full_name, favorite_pokemon_sprite, favorite_pokemon, verified_at, username
        from profiles
        where wishlist_public = true and (username = p_slug or share_slug = p_slug)) p;
$$;

-- Cross-match: what other sharers offer that I want, and what I offer that they want.
create or replace function public.trade_matches()
returns json language sql stable security definer set search_path to 'public' as $$
  with me as (select auth.uid() as uid)
  select json_build_object(
    'theyHaveIWant', coalesce((select json_agg(x) from (
      select distinct on (w.name, w.card_number, t.user_id)
        w.name, w.card_number, t.image_url, p.full_name as who, p.username,
        p.verified_at is not null as verified
      from wishlist_items w
      join trade_items t on lower(trim(t.name)) = lower(trim(w.name))
        and coalesce(trim(t.card_number),'') = coalesce(trim(w.card_number),'')
      join profiles p on p.id = t.user_id, me
      where w.user_id = me.uid and w.acquired = false
        and t.user_id <> me.uid and p.wishlist_public = true
      limit 40) x), '[]'::json),
    'iHaveTheyWant', coalesce((select json_agg(x) from (
      select distinct on (t.name, t.card_number, w.user_id)
        t.name, t.card_number, t.image_url, p.full_name as who, p.username,
        p.verified_at is not null as verified
      from trade_items t
      join wishlist_items w on lower(trim(w.name)) = lower(trim(t.name))
        and coalesce(trim(w.card_number),'') = coalesce(trim(t.card_number),'')
      join profiles p on p.id = w.user_id, me
      where t.user_id = me.uid and w.acquired = false
        and w.user_id <> me.uid and p.wishlist_public = true
      limit 40) x), '[]'::json)
  );
$$;
