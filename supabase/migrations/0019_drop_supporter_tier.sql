-- Every supporter is just a seller/partner — there's no auction-commission
-- tier to track, and it was never shown on the site.
alter table supporters drop column if exists tier;
