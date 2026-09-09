import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Sparkles, ShieldCheck, CircleDollarSign, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/supabase/types";
import { CustomerNav } from "@/components/CustomerNav";
import { MarkAllRead } from "./MarkAllRead";

const ICON: Record<Notification["kind"], typeof Bell> = {
  wishlist_match: Sparkles,
  purchase_confirm: CircleDollarSign,
  dispute: ShieldCheck,
  info: Bell,
  binder_social: Heart,
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function AvisosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/avisos");

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);
  const items = (data ?? []) as Notification[];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <CustomerNav />

        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink text-comic-shadow-sm sm:text-4xl">
            <Bell className="h-6 w-6 text-primary" />
            AVISOS
          </h1>
          {unread > 0 && <MarkAllRead />}
        </div>

        {items.length === 0 ? (
          <p className="mt-8 rounded-2xl border-2 border-dashed border-ink/15 bg-surface/60 p-8 text-center text-sm text-ink-muted">
            Sem avisos por aqui. Quando uma carta da sua lista de desejo aparecer, a gente te conta.
          </p>
        ) : (
          <ul className="mt-6 space-y-2">
            {items.map((n) => {
              const Icon = ICON[n.kind] ?? Bell;
              const inner = (
                <>
                  {n.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external card art
                    <img
                      src={n.image_url}
                      alt=""
                      className="h-14 w-10 shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    {n.body && <p className="text-xs text-ink-muted">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-ink-muted/70">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-deep" />}
                </>
              );
              const cls = `flex items-start gap-3 rounded-2xl border-2 p-3 transition-colors ${
                n.read_at ? "border-ink/10 bg-surface" : "border-orange/30 bg-orange/5"
              }`;
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} className={`${cls} hover:border-orange-deep/40`}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
