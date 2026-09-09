import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import type { PermissionKey } from "@/lib/permissions";
import { AdminNav, type AdminNavItem } from "./AdminNav";
import packageJson from "../../../package.json";

const NAV: (AdminNavItem & { permission?: PermissionKey; ctoOnly?: boolean })[] = [
  { href: "/admin", label: "Painel", icon: "LayoutDashboard" },
  { href: "/admin/cartas", label: "Cartas", icon: "CreditCard", permission: "manage_cards" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "HandCoins", permission: "view_finance" },
  { href: "/admin/quadro", label: "Quadro", icon: "Megaphone", permission: "manage_quadro" },
  { href: "/admin/usuarios", label: "Usuários", icon: "Users", permission: "manage_users" },
  { href: "/admin/permissoes", label: "Permissões", icon: "Lock", ctoOnly: true },
  { href: "/admin/perfil", label: "Meu perfil", icon: "UserCog" },
  { href: "/minhas-cartas", label: "Minhas cartas", icon: "PackageOpen" },
  { href: "/fichario", label: "Fichário", icon: "BookOpen", beta: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, favorite_pokemon_sprite")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "cto" && profile.role !== "admin" && profile.role !== "staff")) {
    redirect("/");
  }

  const isCto = profile.role === "cto";
  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);

  const roleLabel = isCto ? "CTO" : profile.role === "admin" ? "Admin" : "Equipe";

  const navItems = NAV.filter((item) => {
    if (item.ctoOnly) return isCto;
    if (item.permission) return permissions[item.permission];
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      <AdminNav
        items={navItems}
        fullName={profile.full_name ?? ""}
        roleLabel={roleLabel}
        version={packageJson.version}
        avatarSprite={profile.favorite_pokemon_sprite}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10">{children}</main>
    </div>
  );
}
