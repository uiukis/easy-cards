-- Staff can update any profile (needed to manage roles from the admin panel).
create policy "profiles: staff update all" on profiles
  for update using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- Safety net: even though customers can update their own profile (name, etc.),
-- they must never be able to change their own role via that same policy.
create function prevent_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role and not is_staff(auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger enforce_role_change
  before update on profiles
  for each row execute function prevent_role_escalation();
