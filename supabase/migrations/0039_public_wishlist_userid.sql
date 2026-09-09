-- Expose the profile owner's id from public_wishlist() so /u/<slug> can also
-- load that person's shared binders (which already have their own public-read
-- RLS policy) and show a real collector profile, not just the wishlist.
create or replace function public.public_wishlist(p_slug text)
returns json language sql stable security definer set search_path to 'public' as $$
  select case when p.id is null then null else json_build_object(
    'id', p.id,
    'name', case when p.verified_at is not null then p.full_name
                 else split_part(coalesce(p.full_name, ''), ' ', 1) end,
    'username', p.username,
    'verified', p.verified_at is not null,
    'email_confirmed', (select u.email_confirmed_at is not null from auth.users u where u.id = p.id),
    'avatar', p.favorite_pokemon_sprite,
    'pokemon', p.favorite_pokemon,
    'member_since', p.created_at,
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
  from (select id, full_name, favorite_pokemon_sprite, favorite_pokemon, verified_at, username, created_at
        from profiles
        where wishlist_public = true and (username = p_slug or share_slug = p_slug)) p;
$$;
