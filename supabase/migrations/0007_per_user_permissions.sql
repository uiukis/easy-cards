-- Per-person permission overrides, layered on top of the role defaults in
-- role_permissions. A row here always wins over the role default for that
-- one person -- this is how "Bia only sees the quadro, not cards or
-- finance" works without needing a whole new role.
create table user_permissions (
  user_id uuid not null references profiles(id) on delete cascade,
  permission_key text not null,
  allowed boolean not null default false,
  primary key (user_id, permission_key)
);

alter table user_permissions enable row level security;

create policy "user_permissions: staff read" on user_permissions
  for select using (is_staff(auth.uid()));

create policy "user_permissions: cto write" on user_permissions
  for all using (is_cto(auth.uid())) with check (is_cto(auth.uid()));
