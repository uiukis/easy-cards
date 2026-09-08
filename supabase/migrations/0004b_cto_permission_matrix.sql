-- Promote Wilker specifically to the top tier. The role-change trigger
-- runs even for this migration (there's no auth.uid() in a raw admin
-- session, so it would otherwise revert the change), so bypass it here.
alter table profiles disable trigger enforce_role_change;
update profiles set role = 'cto' where phone = '5585994286518';
alter table profiles enable trigger enforce_role_change;

-- is_owner() now means "admin-tier" (cto or admin) -- redefining it in
-- place means every policy that already calls is_owner() (card_finance,
-- event_settings, supporters, announcements) picks up the new tier for
-- free without being touched.
create or replace function is_owner(uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = uid and role in ('cto', 'admin')
  );
$$;

-- Only the CTO can change anyone's role or the permission matrix itself.
create function is_cto(uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = uid and role = 'cto');
$$;

drop policy "profiles: owner update all" on profiles;
create policy "profiles: cto update all" on profiles
  for update using (is_cto(auth.uid())) with check (is_cto(auth.uid()));

-- Close the escalation hole: being staff/admin no longer lets someone
-- change their OWN role via the generic self-update policy -- only a CTO
-- action (via the policy above) may change a role now.
create or replace function prevent_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role and not is_cto(auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end;
$$;

-- Configurable permission matrix: which roles can do what, editable only
-- by the CTO. cto itself is always fully allowed at the app layer and
-- doesn't need rows here.
create table role_permissions (
  role user_role not null,
  permission_key text not null,
  allowed boolean not null default false,
  primary key (role, permission_key)
);

alter table role_permissions enable row level security;

create policy "role_permissions: staff read" on role_permissions
  for select using (is_staff(auth.uid()));

create policy "role_permissions: cto write" on role_permissions
  for all using (is_cto(auth.uid())) with check (is_cto(auth.uid()));

insert into role_permissions (role, permission_key, allowed) values
  ('admin', 'view_finance', true),
  ('admin', 'manage_cards', true),
  ('admin', 'manage_quadro', true),
  ('admin', 'manage_users', false),
  ('staff', 'view_finance', false),
  ('staff', 'manage_cards', true),
  ('staff', 'manage_quadro', false),
  ('staff', 'manage_users', false);
