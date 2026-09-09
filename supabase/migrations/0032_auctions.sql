-- Leilões: for now just a card the team can put on the homepage pointing at
-- the WhatsApp group (bidding stays in the group). The table is shaped to grow
-- into full auction management later (lots, results).

create table auctions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  happens_at timestamptz,
  note text,
  image_url text,
  featured boolean not null default false,
  result text,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index auctions_happens_at_idx on auctions (happens_at desc);

alter table auctions enable row level security;

create policy "auctions: public read" on auctions for select using (true);
create policy "auctions: staff manage" on auctions
  for all using (has_permission(auth.uid(), 'manage_auctions'))
  with check (has_permission(auth.uid(), 'manage_auctions'));

-- only one featured auction at a time
create unique index auctions_one_featured on auctions (featured) where featured;
