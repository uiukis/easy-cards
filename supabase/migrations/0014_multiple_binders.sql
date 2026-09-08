-- Support multiple binders per person (blank / master set / single Pokémon
-- starting points), each with its own name and grid size, instead of one
-- implicit binder per user.
create table binders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null default 'Meu Fichário',
  grid_size text not null default '3x3',
  created_at timestamptz not null default now()
);

alter table binders enable row level security;

create policy "binders: owner full access" on binders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table binder_cards add column binder_id uuid references binders(id) on delete cascade;

-- Backfill: give every user who already has cards a single binder carrying
-- their previous grid size setting, then point their cards at it.
insert into binders (user_id, name, grid_size)
select bc.user_id, 'Meu Fichário', coalesce(bs.grid_size, '3x3')
from (select distinct user_id from binder_cards) bc
left join binder_settings bs on bs.user_id = bc.user_id;

update binder_cards bc
set binder_id = b.id
from binders b
where b.user_id = bc.user_id;

alter table binder_cards alter column binder_id set not null;

drop table binder_settings;
