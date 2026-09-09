-- Track the day a card was physically dropped at the Dominaria deposit box
-- (only meaningful when delivery_method = 'dominaria').
alter table card_finance add column dominaria_deposited_at date;
