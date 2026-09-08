import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, CreditCard, Users, Megaphone, UserCog, Lock, PackageOpen, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import type { PermissionKey } from "@/lib/permissions";
import { LogoutButton } from "./LogoutButton";
import packageJson from "../../../package.json";

const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: PermissionKey;
  ctoOnly?: boolean;
}[] = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/cartas", label: "Cartas", icon: CreditCard, permission: "manage_cards" },
  { href: "/admin/quadro", label: "Quadro", icon: Megaphone, permission: "manage_quadro" },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, permission: "manage_users" },
  { href: "/admin/permissoes", label: "Permissões", icon: Lock, ctoOnly: true },
  { href: "/admin/perfil", label: "Meu perfil", icon: UserCog },
  { href: "/minhas-cartas", label: "Minhas cartas", icon: PackageOpen },
  { href: "/fichario", label: "Fichário", icon: BookOpen },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "cto" && profile.role !== "admin" && profile.role !== "staff")) {
    redirect("/");
  }

  const isCto = profile.role === "cto";
  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);

  const roleLabel = isCto ? "CTO" : profile.role === "admin" ? "Admin" : "Equipe";

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-56 shrink-0 flex-col border-r-2 border-ink/10 bg-surface px-4 py-6">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <Image
            src="/brand/icon-square.png"
            alt="Easy Cards"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="font-display text-sm tracking-wide text-ink">EASY CARDS</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.filter((item) => {
            if (item.ctoOnly) return isCto;
            if (item.permission) return permissions[item.permission];
            return true;
          }).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t-2 border-ink/10 pt-4">
          <p className="truncate px-2 text-xs font-semibold text-ink">{profile.full_name}</p>
          <p className="px-2 text-[11px] text-ink-muted">{roleLabel}</p>
          <LogoutButton className="mt-2 w-full justify-start" />
          <p className="mt-2 px-2 text-[10px] text-ink-muted/60">v{packageJson.version}</p>
        </div>
      </aside>

      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
