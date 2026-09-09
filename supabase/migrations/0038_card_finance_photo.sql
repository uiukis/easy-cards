-- Real photo of the specific card that was sold (condition), separate from the
-- official art. Shown to the buyer in /minhas-cartas.
alter table card_finance add column if not exists photo_url text;
