-- Payment tracking closer to how the finance sheet works: a 3-state status,
-- how much was already paid (for partials), a due date, and a label so a whole
-- auction can be filtered together.

alter table card_finance
  add column if not exists payment_status text not null default 'aberto',
  add column if not exists amount_paid numeric not null default 0,
  add column if not exists due_date date,
  add column if not exists auction_label text;

alter table card_finance drop constraint if exists card_finance_payment_status_check;
alter table card_finance add constraint card_finance_payment_status_check
  check (payment_status in ('aberto', 'parcial', 'pago'));

-- Backfill from the old boolean-ish paid_at.
update card_finance
  set payment_status = 'pago',
      amount_paid = coalesce(final_price, 0)
  where paid_at is not null and payment_status = 'aberto';

create index if not exists card_finance_auction_idx on card_finance (auction_label);
