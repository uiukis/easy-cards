-- In-app notifications. First use: "a carta da sua lista de desejo apareceu"
-- when the team registers a card that matches an open wishlist item. Also
-- carries "confirme sua compra" and, for the team, dispute alerts.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,          -- wishlist_match | purchase_confirm | dispute | info
  title text not null,
  body text,
  link text,
  image_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications: read own" on notifications
  for select using (user_id = auth.uid());

-- a person can only flip read_at on their own rows
create policy "notifications: mark own read" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- inserts come from server actions (service side / definer helper), never
-- from the client — no insert policy on purpose.

-- Fan a new card out to everyone with a matching open wishlist item.
create or replace function public.notify_wishlist_match(
  p_name text, p_card_number text, p_tcg_api_id text, p_image_url text
)
returns integer
language plpgsql security definer set search_path to 'public'
as $$
declare
  n integer := 0;
begin
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
    );
  get diagnostics n = row_count;
  return n;
end;
$$;
