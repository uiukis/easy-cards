import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  Gavel,
  CheckCircle2,
  Sparkles,
  Clock,
  TrendingUp,
  Plus,
  Megaphone,
  Users,
  PackageOpen,
  HandCoins,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/Reveal";

const STATUS_LABEL: Record<string, string> = {
  available: "Disponível",
  in_auction: "Em leilão",
  sold: "Vendida",
};

export default async function AdminDashboard() {
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
  if (!profile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  const firstName = profile.full_name?.split(" ")[0] || "";

  const [{ count: available }, { count: inAuction }, { count: sold }, { data: recentCards }] =
    await Promise.all([
      supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "available"),
      supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "in_auction"),
      supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "sold"),
      supabase
        .from("cards")
        .select("id, name, image_url, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  let recentSales: { id: string; final_price: number | null; cardName: string }[] = [];
  let monthRevenue = 0;
  if (permissions.view_finance) {
    const { data } = await supabase
      .from("card_finance")
      .select("id, final_price, sold_at, cards(name)")
      .not("sold_at", "is", null)
      .order("sold_at", { ascending: false })
      .limit(5);
    recentSales = (data ?? []).map((s) => {
      const related = s.cards as unknown as { name: string } | { name: string }[] | null;
      const card = Array.isArray(related) ? related[0] : related;
      return { id: s.id, final_price: s.final_price, cardName: card?.name ?? "Carta" };
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data: monthSales } = await supabase
      .from("card_finance")
      .select("final_price")
      .gte("sold_at", startOfMonth.toISOString());
    monthRevenue = (monthSales ?? []).reduce((sum, s) => sum + (Number(s.final_price) || 0), 0);
  }

  // "Precisa de olho" — coisas paradas esperando ação da equipe.
  const [{ count: disputed }, { count: openActivity }] = await Promise.all([
    supabase
      .from("card_finance")
      .select("*", { count: "exact", head: true })
      .not("buyer_disputed_at", "is", null),
    supabase
      .from("admin_activity")
      .select("*", { count: "exact", head: true })
      .is("resolved_at", null),
  ]);

  let consignOwed = 0;
  let consignAmount = 0;
  if (permissions.view_finance) {
    const { data: consign } = await supabase
      .from("card_finance")
      .select("final_price, commission_pct, consignor_paid_at, consignor_name")
      .not("consignor_name", "is", null)
      .is("consignor_paid_at", null)
      .not("sold_at", "is", null);
    consignOwed = (consign ?? []).length;
    consignAmount = (consign ?? []).reduce((sum, c) => {
      const price = Number(c.final_price) || 0;
      const pct = Number(c.commission_pct) || 0;
      return sum + price * (1 - pct / 100);
    }, 0);
  }

  const attention = [
    (disputed ?? 0) > 0 && {
      href: "/admin/financeiro",
      label: "Compra contestada",
      value: `${disputed}`,
      tone: "flag" as const,
    },
    permissions.view_finance &&
      consignOwed > 0 && {
        href: "/admin/financeiro",
        label: "Repasse de consignação",
        value: `R$ ${consignAmount.toFixed(2)}`,
        tone: "warn" as const,
      },
    (openActivity ?? 0) > 0 && {
      href: "/admin/atividade",
      label: "Atividade sem resolver",
      value: `${openActivity}`,
      tone: "muted" as const,
    },
  ].filter(Boolean) as { href: string; label: string; value: string; tone: "flag" | "warn" | "muted" }[];

  const stats = [
    { label: "Disponíveis", value: available ?? 0, icon: CreditCard, color: "text-orange-deep" },
    { label: "Em leilão", value: inAuction ?? 0, icon: Gavel, color: "text-blue-dark" },
    { label: "Vendidas", value: sold ?? 0, icon: CheckCircle2, color: "text-teal" },
  ];

  const quickActions = [
    permissions.manage_cards && {
      href: "/admin/cartas",
      label: "Nova carta",
      icon: Plus,
      className: "bg-orange-deep text-white shadow-orange-deep/25",
    },
    permissions.view_finance && {
      href: "/admin/financeiro",
      label: "Financeiro",
      icon: HandCoins,
      className: "border-2 border-ink/15 bg-surface text-ink hover:bg-surface-alt",
    },
    permissions.manage_quadro && {
      href: "/admin/quadro",
      label: "Quadro",
      icon: Megaphone,
      className: "border-2 border-ink/15 bg-surface text-ink hover:bg-surface-alt",
    },
    permissions.manage_users && {
      href: "/admin/usuarios",
      label: "Usuários",
      icon: Users,
      className: "border-2 border-ink/15 bg-surface text-ink hover:bg-surface-alt",
    },
    {
      href: "/fichario",
      label: "Fichário",
      icon: PackageOpen,
      className: "border-2 border-ink/15 bg-surface text-ink hover:bg-surface-alt",
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Plus; className: string }[];

  return (
    <div>
      <Reveal className="bg-halftone -mx-4 -mt-6 rounded-b-[2rem] px-4 pb-6 pt-2 sm:-mx-6 sm:-mt-8 sm:px-6 sm:pt-4 md:-mx-10 md:-mt-8 md:px-10">
        <p className="font-comic text-sm text-primary">
          {firstName ? `E aí, ${firstName}!` : "E aí!"} <Sparkles className="inline h-4 w-4" />
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink text-comic-shadow-sm sm:text-4xl">PAINEL</h1>
        <p className="mt-1 text-sm text-ink-muted">Resumo do catálogo de cartas.</p>

        {quickActions.length > 0 && (
          <div className="mt-5 -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 ${a.className}`}
              >
                <a.icon className="h-4 w-4" />
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </Reveal>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((c, i) => (
          <Reveal key={c.label} delay={0.05 + i * 0.06}>
            <Card>
              <CardContent>
                <c.icon className={`h-5 w-5 ${c.color}`} />
                <p className="mt-3 font-display text-3xl text-ink">{c.value}</p>
                <p className="text-sm text-ink-muted">{c.label}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
        {permissions.view_finance && (
          <Reveal delay={0.05 + stats.length * 0.06} className="col-span-2 lg:col-span-1">
            <Card>
              <CardContent>
                <TrendingUp className="h-5 w-5 text-teal" />
                <p className="mt-3 font-display text-3xl text-ink">R$ {monthRevenue.toFixed(2)}</p>
                <p className="text-sm text-ink-muted">Vendido esse mês</p>
              </CardContent>
            </Card>
          </Reveal>
        )}
      </div>

      {attention.length > 0 && (
        <Reveal delay={0.05} className="mt-6">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h2 className="font-display text-sm tracking-wide text-ink">PRECISA DE OLHO</h2>
              </div>
              <ul className="mt-3 divide-y divide-ink/10">
                {attention.map((a) => (
                  <li key={a.label}>
                    <Link
                      href={a.href}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-primary"
                    >
                      <span className="text-ink-muted">{a.label}</span>
                      <span
                        className={`shrink-0 font-display text-lg ${
                          a.tone === "flag"
                            ? "text-destructive"
                            : a.tone === "warn"
                              ? "text-orange-deep"
                              : "text-ink"
                        }`}
                      >
                        {a.value}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Reveal delay={0.3}>
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-ink-muted" />
                <h2 className="font-display text-sm tracking-wide text-ink">CARTAS RECENTES</h2>
              </div>
              {!recentCards || recentCards.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">Nenhuma carta cadastrada ainda.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {recentCards.map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                        <img src={c.image_url} alt={c.name} className="h-10 w-7 rounded-sm object-cover" />
                      ) : (
                        <div className="h-10 w-7 rounded-sm bg-surface-alt" />
                      )}
                      <span className="flex-1 truncate text-sm text-ink">{c.name}</span>
                      <Badge variant="secondary">{STATUS_LABEL[c.status] ?? c.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {permissions.view_finance && (
          <Reveal delay={0.36}>
            <Card>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-ink-muted" />
                  <h2 className="font-display text-sm tracking-wide text-ink">VENDAS RECENTES</h2>
                </div>
                {recentSales.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-muted">Nenhuma venda registrada ainda.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {recentSales.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-ink">{s.cardName}</span>
                        <span className="shrink-0 font-semibold text-primary">
                          R$ {Number(s.final_price ?? 0).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </Reveal>
        )}
      </div>
    </div>
  );
}
