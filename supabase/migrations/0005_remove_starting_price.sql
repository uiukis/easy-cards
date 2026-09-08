-- No such thing as a starting price -- sales run by WhatsApp poll (enquete)
-- with a fixed set of price options, not an ascending auction. Only the
-- final price a card actually sold for matters.
alter table card_finance drop column if exists starting_price;
