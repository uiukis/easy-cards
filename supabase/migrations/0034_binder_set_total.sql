-- When a binder is created from a full set, remember the set's card count so
-- the cover can show "142/191 · 74%".
alter table binders add column if not exists set_total smallint;
