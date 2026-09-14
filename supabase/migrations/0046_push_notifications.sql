-- Web Push subscriptions, one row per browser/device a user enabled
-- notifications on.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions: manage own" on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Server actions write through the service-role client (bypasses RLS) so
-- re-subscribing a device that belonged to a previous account on this
-- browser correctly reassigns it, rather than tripping the "own rows" check.

-- notify_wishlist_match now also returns the matched user ids, so callers
-- can fan a push notification out to those users' subscribed devices.
drop function if exists public.notify_wishlist_match(text, text, text, text);

create function public.notify_wishlist_match(
  p_name text, p_card_number text, p_tcg_api_id text, p_image_url text
)
returns table(user_id uuid)
language plpgsql security definer set search_path to 'public'
as $$
begin
  return query
  insert into notifications (user_id, kind, title, body, link, image_url)
  select w.user_id,
         'wishlist_match',
         'Apareceu uma carta da sua lista!',
         p_name || case when p_card_number is not null and p_card_number <> ''
                        then ' (' || p_card_number || ')' else '' end
              || ' entrou no catálogo da Easy Cards.',
         '/lista-de-desejos',
         p_image_url
  from wishlist_items w
  where w.acquired = false
    and (
      (p_tcg_api_id is not null and p_tcg_api_id <> '' and w.tcg_api_id = p_tcg_api_id)
      or (lower(trim(w.name)) = lower(trim(p_name))
          and coalesce(trim(w.card_number), '') = coalesce(trim(p_card_number), ''))
    )
    -- don't double-notify for the same card within a day
    and not exists (
      select 1 from notifications nx
      where nx.user_id = w.user_id and nx.kind = 'wishlist_match'
        and nx.created_at > now() - interval '1 day'
        and nx.body like p_name || '%'
    )
  returning notifications.user_id;
end;
$$;
