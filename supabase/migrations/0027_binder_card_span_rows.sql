-- Cards/images can already span 2 columns; add row-span too so a slot can be
-- 2x2 — the size people use for toploaders and centrepiece art.
alter table binder_cards add column if not exists span_rows smallint not null default 1;
