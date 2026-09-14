-- Real empty pockets: a binder_cards row that exists (has a position) but
-- holds nothing. Needed so a card can be dragged past existing cards and
-- leave a genuine gap behind it — before this, "empty" was purely the
-- trailing remainder of a page (cardsPerPage - real cards), so dropping on
-- any of those always resolved to the same "append at the end" position and
-- moving the last card further right did nothing.
alter table binder_cards add column if not exists is_blank boolean not null default false;
