-- Anyone (customer, staff, admin, cto -- buying isn't role-restricted) can
-- read their own purchase history, even though only admin-tier can read
-- everyone else's via the existing owner-full-access policy.
create policy "card_finance: buyer reads own" on card_finance
  for select using (buyer_id = auth.uid());

-- A buyer can also read the (otherwise staff-only) card row for anything
-- they've actually bought, so the portal can show its name/image.
create policy "cards: buyer reads bought" on cards
  for select using (
    exists (
      select 1 from card_finance
      where card_finance.card_id = cards.id and card_finance.buyer_id = auth.uid()
    )
  );
