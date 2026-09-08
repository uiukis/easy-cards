import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Gavel, CheckCircle2, Sparkles, Clock, TrendingUp, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  const stats = [
    { label: "Disponíveis", value: available ?? 0, icon: CreditCard },
    { label: "Em leilão", value: inAuction ?? 0, icon: Gavel },
    { label: "Vendidas", value: sold ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div>
      <p className="font-comic text-sm text-primary">
        {firstName ? `E aí, ${firstName}!` : "E aí!"} <Sparkles className="inline h-4 w-4" />
      </p>
      <h1 className="mt-1 font-display text-3xl text-ink text-comic-shadow-sm">PAINEL</h1>
      <p className="mt-1 text-sm text-ink-muted">Resumo do catálogo de cartas.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((c) => (
          <Card key={c.label}>
            <CardContent>
              <c.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-3xl text-ink">{c.value}</p>
              <p className="text-sm text-ink-muted">{c.label}</p>
            </CardContent>
          </Card>
        ))}
        {permissions.view_finance && (
          <Card>
            <CardContent>
              <TrendingUp className="h-5 w-5 text-teal" />
              <p className="mt-3 font-display text-3xl text-ink">R$ {monthRevenue.toFixed(2)}</p>
              <p className="text-sm text-ink-muted">Vendido esse mês</p>
            </CardContent>
          </Card>
        )}
      </div>

      {permissions.manage_cards && (
        <div className="mt-6">
          <Button render={<Link href="/admin/cartas" />} nativeButton={false}>
            <Plus className="h-4 w-4" />
            Nova carta
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
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

        {permissions.view_finance && (
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
        )}
      </div>
    </div>
  );
}
