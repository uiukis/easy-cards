-- "Faz uma parte só de matérias" -- press coverage, managed the same way as
-- announcements/supporters (owner-only write, public reads active ones).
create table press_mentions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  outlet text not null,
  outlet_instagram text,
  journalist text,
  journalist_instagram text,
  url text not null,
  image_url text,
  published_date date,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table press_mentions enable row level security;

create policy "press_mentions: owner full access" on press_mentions
  for all using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

create policy "press_mentions: public read active" on press_mentions
  for select using (active = true);

insert into press_mentions (title, outlet, outlet_instagram, journalist, journalist_instagram, url, image_url, published_date, sort_order) values (
  'Easy Cards leva oficina gratuita de Pokémon TCG ao Shopping RioMar Kennedy com compra, venda e troca de cartas',
  'Tudo de Novo',
  'https://www.instagram.com/tudodenovo_tdn/',
  'Helaine Oliveira',
  'https://www.instagram.com/hel_oliver/',
  'https://blogtudodenovo.com/easy-cards-leva-oficina-gratuita-de-pokemon-tcg-ao-shopping-riomar-kennedy-com-compra-venda-e-troca-de-cartas/',
  'https://i0.wp.com/blogtudodenovo.com/wp-content/uploads/2025/01/riomar-kennedy-20.jpg?fit=300%2C169&ssl=1',
  '2026-09-08',
  0
);
