-- Split "manage users" into a view permission (any team member) and keep
-- manage_users for acting on a user (verify identity, fix phone). Handing out
-- roles / editing the permission matrix stays CTO-only (no key for it).
--
-- Also add view_analytics for the analytics dashboard, which moved under /admin.

insert into role_permissions (role, permission_key, allowed) values
  ('admin', 'view_users', true),
  ('staff', 'view_users', true),
  ('admin', 'view_analytics', true),
  ('staff', 'view_analytics', false)
on conflict (role, permission_key) do update set allowed = excluded.allowed;

-- Anyone who already had manage_users keeps seeing users (resolver also
-- enforces this, this is just to keep the matrix readable).
insert into role_permissions (role, permission_key, allowed)
select role, 'view_users', true from role_permissions
where permission_key = 'manage_users' and allowed = true
on conflict (role, permission_key) do update set allowed = excluded.allowed;
