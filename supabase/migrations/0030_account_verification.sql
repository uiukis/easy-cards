-- Free anti-impersonation layer. Signup is phone+password with no SMS (paid),
-- so anyone can register any number. Instead of blocking that, we make it
-- low-value: accounts are "unverified" until a staffer vouches, unverified
-- accounts show less identity publicly, and a buyer must confirm a purchase
-- the shop linked to them.

alter table profiles add column if not exists verified_at timestamptz;
alter table profiles add column if not exists verified_by uuid references profiles(id);

-- "A loja marcou que você comprou isso — foi você?"
alter table card_finance add column if not exists buyer_confirmed_at timestamptz;
alter table card_finance add column if not exists buyer_disputed_at timestamptz;

-- Buyer confirms/disputes only the two flags on their own finance row.
create or replace function public.confirm_purchase(p_finance_id uuid, p_disputed boolean)
returns void
language sql security definer set search_path to 'public'
as $$
  update card_finance
  set buyer_confirmed_at = case when p_disputed then null else now() end,
      buyer_disputed_at  = case when p_disputed then now() else null end
  where id = p_finance_id and buyer_id = auth.uid();
$$;

-- Public wishlist page: only expose the verified full name; otherwise a first
-- name + "não verificado" so an impostor's page isn't convincing.
create or replace function public.public_wishlist(p_slug text)
returns json
language sql stable security definer set search_path to 'public'
as $$
  select case when p.id is null then null else json_build_object(
    'name', case when p.verified_at is not null
                 then p.full_name
                 else split_part(coalesce(p.full_name, ''), ' ', 1) end,
    'verified', p.verified_at is not null,
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
    select id, full_name, favorite_pokemon_sprite, favorite_pokemon, verified_at
    from profiles where share_slug = p_slug and wishlist_public = true
  ) p;
$$;
