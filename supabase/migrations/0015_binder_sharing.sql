-- Public read-only sharing: a binder with share_enabled=true can be viewed
-- (but not edited) by anyone with the link, no account needed.
alter table binders add column share_enabled boolean not null default false;

create policy "binders: public read when shared" on binders
  for select using (share_enabled = true);

create policy "binder_cards: public read when binder shared" on binder_cards
  for select using (
    exists (select 1 from binders b where b.id = binder_cards.binder_id and b.share_enabled = true)
  );
