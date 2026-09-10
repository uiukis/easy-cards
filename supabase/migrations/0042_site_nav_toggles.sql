-- Which homepage nav links are hidden (array of hrefs). Managed from
-- /admin/home, so let manage_quadro write site_settings too (card-of-week
-- already lives there and is a manage_quadro screen).

insert into site_settings (key, value)
values ('nav_hidden', '[]'::jsonb)
on conflict (key) do nothing;

drop policy if exists "site_settings: staff write" on site_settings;
create policy "site_settings: staff write" on site_settings
  for all
  using (
    has_permission(auth.uid(), 'manage_cards')
    or has_permission(auth.uid(), 'manage_quadro')
  )
  with check (
    has_permission(auth.uid(), 'manage_cards')
    or has_permission(auth.uid(), 'manage_quadro')
  );
