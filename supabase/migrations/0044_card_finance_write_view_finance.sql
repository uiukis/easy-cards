-- card_finance writes were owner-only (cto/admin). The finance person is
-- "staff" with view_finance, and every finance action already gates on
-- view_finance in app code (markCardPaid, upsertCardFinance via the modal,
-- the leilão importer). Align the RLS with that.

drop policy if exists "card_finance: owner full access" on card_finance;
create policy "card_finance: finance write" on card_finance
  for all
  using (is_owner(auth.uid()) or has_permission(auth.uid(), 'view_finance'))
  with check (is_owner(auth.uid()) or has_permission(auth.uid(), 'view_finance'));
