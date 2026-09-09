-- Move the founders/team from a hardcoded list in the code into a table the
-- admin can edit, matching how apoiadores and imprensa work.
create table founders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  instagram text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table founders enable row level security;

create policy "founders: owner full access" on founders
  for all using (is_owner(auth.uid())) with check (is_owner(auth.uid()));

create policy "founders: public read active" on founders
  for select using (active = true);

insert into founders (name, role, instagram, image_url, sort_order) values
  ('Bão Santos', 'CEO', 'https://www.instagram.com/baosantoss/', 'https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team/bao-santos.jpg', 1),
  ('Emanoel Sátiro', 'CEO', 'https://www.instagram.com/emanoelsatiro_/', 'https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team/emanoel-satiro.jpg', 2),
  ('Victoria Silva', 'COO', 'https://www.instagram.com/torywins_/', 'https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team/tory-silva.jpg', 3),
  ('Wilker Quirino', 'CTO', 'https://www.instagram.com/_uiukis/', 'https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team/wilker-quirino.jpg', 4),
  ('Amanda Souza', 'Coordenadora e Assessoria', 'https://www.instagram.com/amanda.sm.br/', 'https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team/amanda-souza.jpg', 5),
  ('Lara Lima', 'Host e Influenciadora', 'https://www.instagram.com/larita.tcg/', 'https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team/lara-lima.jpg', 6),
  ('Beatriz Giffoni', 'Mídias', 'https://www.instagram.com/sbia.jpg/', 'https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team/beatriz-giffoni.jpg', 7);
