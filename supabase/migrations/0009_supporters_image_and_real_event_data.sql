alter table supporters add column if not exists image_url text;

-- Backfill event_settings with what's actually live on the public site
-- (it only had a title before -- everything else was still hardcoded).
update event_settings set
  event_date = '2026-09-19',
  place = 'Shopping RioMar Kennedy',
  tag = 'Educativo, não competitivo',
  banner_message = 'Primeiro evento presencial da Easy Cards — 19 de setembro no Shopping RioMar Kennedy',
  form_url = 'https://docs.google.com/forms/d/e/1FAIpQLSfF8F_p1OM5NWIbFaAcpmvPoOKHKVNHUxhT5S2QeyRBY9lwWQ/viewform'
where id = true;
