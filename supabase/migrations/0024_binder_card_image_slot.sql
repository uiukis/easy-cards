-- A slot can hold an uploaded image instead of a TCG card, so people can
-- build "personalised" binders (art, photos, dividers). Image slots are
-- just binder_cards with is_image = true and an uploaded image_url.
alter table binder_cards add column is_image boolean not null default false;

-- Storage: a public `binders` bucket, upload allowed to anyone (guests
-- included). Create it in the dashboard / via the storage API — this file
-- documents it:
--   bucket "binders" (public, 5 MB, image/*)
--   policy: insert/update for anon+authenticated where bucket_id = 'binders'
