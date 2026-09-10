import type { UserRole } from "./supabase/types";

export type PermissionKey =
  | "view_finance"
  | "manage_cards"
  | "manage_quadro"
  | "view_users"
  | "manage_users"
  | "view_wishlists"
  | "manage_auctions"
  | "view_analytics";

export const PERMISSION_LABEL: Record<PermissionKey, string> = {
  view_finance: "Ver valores e financeiro",
  manage_cards: "Gerenciar catálogo de cartas",
  manage_quadro: "Gerenciar quadro (apoiadores, imprensa)",
  view_users: "Ver a lista de usuários",
  manage_users: "Verificar contas e corrigir telefone",
  view_wishlists: "Ver listas de desejo dos usuários",
  manage_auctions: "Gerenciar leilões",
  view_analytics: "Ver analytics de visitas",
};

// Only the CTO can hand out roles and edit the permission matrix — there is no
// permission key for that on purpose (see /admin/permissoes and updateUserRole).

export type Permissions = Record<PermissionKey, boolean>;

const ALL_TRUE: Permissions = {
  view_finance: true,
  manage_cards: true,
  manage_quadro: true,
  view_users: true,
  manage_users: true,
  view_wishlists: true,
  manage_auctions: true,
  view_analytics: true,
};

const ALL_FALSE: Permissions = {
  view_finance: false,
  manage_cards: false,
  manage_quadro: false,
  view_users: false,
  manage_users: false,
  view_wishlists: false,
  manage_auctions: false,
  view_analytics: false,
};

// The CTO is always fully allowed and is the only one who can edit this
// matrix -- `role_permissions` rows only cover admin/staff. `userOverrides`
// are per-person rows that always win over the role default for that one
// person (e.g. Bia is "staff" but should only see the quadro).
//
// `rows` may carry a `role` field (the full table) or not (already filtered);
// when it is present we only apply rows for this person's role.
export function resolvePermissions(
  role: UserRole,
  rows: { role?: string; permission_key: string; allowed: boolean }[],
  userOverrides: { permission_key: string; allowed: boolean }[] = []
): Permissions {
  if (role === "cto") return ALL_TRUE;
  if (role === "customer") return ALL_FALSE;

  const perms = { ...ALL_FALSE };
  for (const row of rows) {
    if (row.role && row.role !== role) continue;
    if (row.permission_key in perms) {
      perms[row.permission_key as PermissionKey] = row.allowed;
    }
  }
  for (const row of userOverrides) {
    if (row.permission_key in perms) {
      perms[row.permission_key as PermissionKey] = row.allowed;
    }
  }

  // acting on users implies being able to see them
  if (perms.manage_users) perms.view_users = true;

  return perms;
}
