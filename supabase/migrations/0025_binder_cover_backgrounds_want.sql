-- jovvitcg-style personalisation for binders:
--   * a "capa" (cover page) with an optional image + subtitle and live stats
--   * per-page background images (keyed by page index, like page_labels)
--   * per-card "Tenho / Quero" tracking (want = true means it's on the wishlist)

alter table binders add column if not exists cover_enabled boolean not null default false;
alter table binders add column if not exists cover_image_url text;
alter table binders add column if not exists cover_subtitle text;
alter table binders add column if not exists page_backgrounds jsonb not null default '{}'::jsonb;

alter table binder_cards add column if not exists want boolean not null default false;
