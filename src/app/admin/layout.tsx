import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, CreditCard, Users, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/cartas", label: "Cartas", icon: CreditCard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
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

  if (!profile || (profile.role !== "owner" && profile.role !== "staff")) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-56 shrink-0 flex-col border-r-2 border-ink/10 bg-surface px-4 py-6">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <ShieldCheck className="h-5 w-5 text-orange-deep" />
          <span className="font-display text-sm tracking-wide text-ink">EASY CARDS</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
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
          <p className="px-2 text-[11px] text-ink-muted">
            {profile.role === "owner" ? "Dono" : "Equipe"}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
