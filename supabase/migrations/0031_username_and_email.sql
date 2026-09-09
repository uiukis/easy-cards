-- Usernames: a clean handle for the public profile link (/u/uiukis) and an
-- identity anchor. Email lives in auth.users (added via supabase.auth.updateUser)
-- and is optional — a free extra: account recovery + a "contato confirmado"
-- signal on public profiles.

alter table profiles add column if not exists username text unique;
alter table profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

-- Public wishlist page: match by username first, then the random share_slug,
-- and expose whether the person has a confirmed email.
create or replace function public.public_wishlist(p_slug text)
returns json
language sql stable security definer set search_path to 'public'
as $$
  select case when p.id is null then null else json_build_object(
    'name', case when p.verified_at is not null
                 then p.full_name
                 else split_part(coalesce(p.full_name, ''), ' ', 1) end,
    'username', p.username,
    'verified', p.verified_at is not null,
    'email_confirmed', (
      select u.email_confirmed_at is not null from auth.users u where u.id = p.id
    ),
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
    select id, full_name, favorite_pokemon_sprite, favorite_pokemon, verified_at, username
    from profiles
    where wishlist_public = true and (username = p_slug or share_slug = p_slug)
  ) p;
$$;

-- Quick "is this handle free?" check for the profile screen.
create or replace function public.username_available(p_name text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select p_name ~ '^[a-z0-9_]{3,20}$'
     and not exists (select 1 from profiles where username = p_name);
$$;
