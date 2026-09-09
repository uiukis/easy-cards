-- "Vendida" is the card's status; paid_at tracks whether the money actually
-- landed, which the finance team follows separately.
alter table card_finance add column paid_at date;
