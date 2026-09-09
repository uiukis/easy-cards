import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, UserPlus, ShieldAlert, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { ResolveButton } from "./ResolveButton";

const ICON: Record<string, typeof Bell> = {
  signup: UserPlus,
  dispute: ShieldAlert,
  info: Bell,
};

function ago(iso: string) {
  const s = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function AtividadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/atividade");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["cto", "admin", "staff"].includes(profile.role)) redirect("/");

  const { data } = await supabase
    .from("admin_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  const items = data ?? [];
  const open = items.filter((i) => !i.resolved_at);

  return (
    <div>
      <AdminPageHeader
        title="ATIVIDADE"
        subtitle="Cadastros novos, contestações e outros avisos pra equipe."
      />

      {open.length > 0 && (
        <p className="mt-4 text-sm text-ink-muted">{open.length} sem resolver</p>
      )}

      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
          Nada por aqui ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((n) => {
            const Icon = ICON[n.kind] ?? Bell;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-2xl border-2 p-3 ${
                  n.resolved_at ? "border-ink/10 bg-surface opacity-60" : "border-orange/30 bg-orange/5"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-alt">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="text-xs text-ink-muted">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-ink-muted/70">{ago(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="rounded-full border-2 border-ink/15 px-2.5 py-1 text-xs font-bold text-ink hover:bg-surface-alt"
                    >
                      Abrir
                    </Link>
                  )}
                  {!n.resolved_at ? (
                    <ResolveButton id={n.id} />
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-teal">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
