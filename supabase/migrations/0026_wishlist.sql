-- Wishlist ("lista de desejo"): cards a person wants. Three audiences:
--   1. the owner (full control)
--   2. staff holding the new `view_wishlists` permission — a unified view of
--      everyone's wants, so the team can stock-check / source them
--   3. the public, but ONLY when the owner turns on their shareable profile
--      (a random share_slug drives /u/<slug>) — to grease trades in the community

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tcg_api_id text,
  name text not null,
  set_name text,
  card_number text,
  image_url text not null,
  rarity text,
  types text,
  priority smallint not null default 2, -- 1 alta / 2 normal / 3 baixa
  note text,
  acquired boolean not null default false,
  created_at timestamptz not null default now()
);

create index wishlist_items_user_idx on wishlist_items (user_id);
create index wishlist_items_name_idx on wishlist_items (lower(name));

alter table wishlist_items enable row level security;

-- Shareable profile
alter table profiles add column if not exists wishlist_public boolean not null default false;
alter table profiles add column if not exists share_slug text unique;

-- Permission resolver mirroring resolvePermissions() in src/lib/permissions.ts,
-- as a SECURITY DEFINER helper so RLS policies stay one-liners.
create or replace function public.has_permission(uid uuid, perm text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select case
    when exists (select 1 from profiles where id = uid and role = 'cto') then true
    when not exists (select 1 from profiles where id = uid and role in ('admin','staff')) then false
    when exists (select 1 from user_permissions where user_id = uid and permission_key = perm)
      then coalesce((select allowed from user_permissions where user_id = uid and permission_key = perm), false)
    else coalesce((
      select rp.allowed
      from role_permissions rp
      join profiles p on p.role = rp.role
      where p.id = uid and rp.permission_key = perm
      limit 1
    ), false)
  end;
$$;

create policy "wishlist: owner full access" on wishlist_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "wishlist: staff with permission read all" on wishlist_items
  for select using (has_permission(auth.uid(), 'view_wishlists'));

create policy "wishlist: public read when profile shared" on wishlist_items
  for select using (
    exists (select 1 from profiles p where p.id = wishlist_items.user_id and p.wishlist_public = true)
  );

-- Public /u/<slug> reads through this instead of opening up the profiles table
-- (which carries phone numbers). Returns only safe fields + unacquired wants.
create or replace function public.public_wishlist(p_slug text)
returns json
language sql stable security definer set search_path to 'public'
as $$
  select case when p.id is null then null else json_build_object(
    'name', p.full_name,
    'avatar', p.favorite_pokemon_sprite,
    'pokemon', p.favorite_pokemon,
    'items', coalesce((
      select json_agg(json_build_object(
        'id', w.id, 'name', w.name, 'set_name', w.set_name,
        'card_number', w.card_number, 'image_url', w.image_url,
        'rarity', w.rarity, 'priority', w.priority, 'note', w.note
      ) order by w.priority, w.created_at)
      from wishlist_items w
      where w.user_id = p.id and w.acquired = false
    ), '[]'::json)
  ) end
  from (
    select id, full_name, favorite_pokemon_sprite, favorite_pokemon
    from profiles where share_slug = p_slug and wishlist_public = true
  ) p;
$$;
