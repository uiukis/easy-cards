-- Consignação: cards the shop sells on behalf of someone else.
alter table card_finance add column if not exists consignor_name text;      -- whose card it is
alter table card_finance add column if not exists commission_pct numeric;   -- Easy Cards' cut, %
alter table card_finance add column if not exists consignor_paid_at date;   -- when we repassed the rest
