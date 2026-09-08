-- Which printing of the card you own (reverse holo, 1st edition...) and
-- whether it takes up more than one grid slot (jumbo cards, V-UNIONs).
alter table binder_cards add column variant text;
alter table binder_cards add column span_cols smallint not null default 1;
