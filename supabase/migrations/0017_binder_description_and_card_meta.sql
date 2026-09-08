-- A short "what's this binder for" note, shown on the binder and its
-- public share page.
alter table binders add column description text;

-- Extra card metadata captured from the TCG API at add time, so binders can
-- be sorted by rarity or Pokémon type without a second API round-trip.
-- `types` is comma-joined (e.g. "Fire,Flying").
alter table binder_cards add column rarity text;
alter table binder_cards add column types text;
