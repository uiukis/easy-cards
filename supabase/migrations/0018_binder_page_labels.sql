-- Optional per-page labels, keyed by page index as a string:
-- { "0": "Kanto", "2": "Johto" }. Shown on the page nav, the overview,
-- the printed sheets and the public share page.
alter table binders add column page_labels jsonb not null default '{}'::jsonb;
