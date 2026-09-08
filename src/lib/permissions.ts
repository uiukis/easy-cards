import type { UserRole } from "./supabase/types";

export type PermissionKey = "view_finance" | "manage_cards" | "manage_quadro" | "manage_users";

export const PERMISSION_LABEL: Record<PermissionKey, string> = {
  view_finance: "Ver valores e financeiro",
  manage_cards: "Gerenciar catálogo de cartas",
  manage_quadro: "Gerenciar quadro (apoiadores, imprensa)",
  manage_users: "Gerenciar usuários e permissões",
};

export type Permissions = Record<PermissionKey, boolean>;

const ALL_TRUE: Permissions = {
  view_finance: true,
  manage_cards: true,
  manage_quadro: true,
  manage_users: true,
};

const ALL_FALSE: Permissions = {
  view_finance: false,
  manage_cards: false,
  manage_quadro: false,
  manage_users: false,
};

// The CTO is always fully allowed and is the only one who can edit this
// matrix -- `role_permissions` rows only cover admin/staff. `userOverrides`
// are per-person rows that always win over the role default for that one
// person (e.g. Bia is "staff" but should only see the quadro).
export function resolvePermissions(
  role: UserRole,
  rows: { permission_key: string; allowed: boolean }[],
  userOverrides: { permission_key: string; allowed: boolean }[] = []
): Permissions {
  if (role === "cto") return ALL_TRUE;
  if (role === "customer") return ALL_FALSE;

  const perms = { ...ALL_FALSE };
  for (const row of rows) {
    if (row.permission_key in perms) {
      perms[row.permission_key as PermissionKey] = row.allowed;
    }
  }
  for (const row of userOverrides) {
    if (row.permission_key in perms) {
      perms[row.permission_key as PermissionKey] = row.allowed;
    }
  }
  return perms;
}
