import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Wallet, Clock, Truck, Users, FileText, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MarkButton } from "./QuickActions";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function daysSince(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "hoje" : d === 1 ? "1 dia" : `${d} dias`;
}

type FinRow = {
  card_id: string;
  final_price: number | null;
  delivery_method: "maos" | "dominaria" | null;
  dominaria_fee: number | null;
  dominaria_deposited_at: string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  sold_at: string | null;
  paid_at: string | null;
  cards: { name: string; status: string } | { name: string; status: string }[] | null;
};

function card(row: FinRow) {
  return Array.isArray(row.cards) ? row.cards[0] : row.cards;
}
function cardName(row: FinRow) {
  return card(row)?.name ?? "Carta";
}
function isSold(row: FinRow) {
  return !!row.sold_at || card(row)?.status === "sold";
}
function soldWhen(row: FinRow) {
  return row.sold_at ?? null;
}

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/financeiro");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  if (!permissions.view_finance) redirect("/admin");

  const { data } = await supabase
    .from("card_finance")
    .select(
      "card_id, final_price, delivery_method, dominaria_fee, dominaria_deposited_at, buyer_id, buyer_name, sold_at, paid_at, cards(name, status)"
    );
  const rows = (data ?? []) as FinRow[];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sold = rows.filter(isSold);
  const num = (n: number | null | undefined) => Number(n) || 0;

  const totalAll = sold.reduce((s, r) => s + num(r.final_price), 0);
  const totalMonth = sold
    .filter((r) => soldWhen(r) && new Date(soldWhen(r)!) >= startOfMonth)
    .reduce((s, r) => s + num(r.final_price), 0);

  const receivable = sold.filter((r) => !r.paid_at);
  const receivableTotal = receivable.reduce((s, r) => s + num(r.final_price), 0);

  const domiFees = rows
    .filter((r) => r.delivery_method === "dominaria")
    .reduce((s, r) => s + num(r.dominaria_fee), 0);

  const domiPending = rows.filter(
    (r) => r.delivery_method === "dominaria" && !r.dominaria_deposited_at
  );

  // per buyer
  const byBuyer = new Map<
    string,
    { name: string; count: number; total: number; owed: number }
  >();
  for (const r of sold) {
    const key = r.buyer_id ?? r.buyer_name ?? "—";
    const name = r.buyer_name || (r.buyer_id ? "Comprador" : "Sem comprador");
    const cur = byBuyer.get(key) ?? { name, count: 0, total: 0, owed: 0 };
    cur.count += 1;
    cur.total += num(r.final_price);
    if (!r.paid_at) cur.owed += num(r.final_price);
    byBuyer.set(key, cur);
  }
  const buyers = [...byBuyer.values()].sort((a, b) => b.owed - a.owed || b.total - a.total);

  const recentSales = [...sold]
    .sort((a, b) => new Date(soldWhen(b) ?? 0).getTime() - new Date(soldWhen(a) ?? 0).getTime())
    .slice(0, 8);

  const kpis = [
    { label: "Vendido esse mês", value: brl(totalMonth), icon: TrendingUp, color: "text-teal" },
    { label: "Vendido total", value: brl(totalAll), icon: Wallet, color: "text-ink" },
    {
      label: "A receber",
      value: brl(receivableTotal),
      icon: Clock,
      color: "text-destructive",
      hint: `${receivable.length} carta(s)`,
    },
    { label: "Taxas Dominaria", value: brl(domiFees), icon: Truck, color: "text-orange-deep" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="FINANCEIRO"
        subtitle="Vendas, recebíveis e entregas."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/financeiro/pdf"
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-deep px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-orange-deep/90"
            >
              <FileText className="h-3.5 w-3.5" />
              Relatório PDF
            </Link>
            <Link
              href="/admin/cartas"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-alt"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar catálogo
            </Link>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent>
              <k.icon className={`h-5 w-5 ${k.color}`} />
              <p className="mt-3 font-display text-2xl text-ink">{k.value}</p>
              <p className="text-sm text-ink-muted">{k.label}</p>
              {k.hint && <p className="text-xs text-ink-muted/70">{k.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              <h2 className="font-display text-sm tracking-wide text-ink">A RECEBER</h2>
            </div>
            {receivable.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">Tudo pago. 🎉</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {receivable
                  .sort((a, b) => new Date(soldWhen(a) ?? 0).getTime() - new Date(soldWhen(b) ?? 0).getTime())
                  .map((r) => (
                    <li key={r.card_id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm">
                      <Link href={`/admin/cartas?finance=${r.card_id}`} className="group min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink group-hover:underline">{cardName(r)}</p>
                        <p className="text-xs text-ink-muted">
                          {r.buyer_name || "sem comprador"} {soldWhen(r) ? ` · vendida há ${daysSince(soldWhen(r)!)}` : ""}
                        </p>
                      </Link>
                      <span className="shrink-0 font-semibold text-destructive">
                        {brl(num(r.final_price))}
                      </span>
                      <MarkButton kind="paid" cardId={r.card_id} />
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-deep" />
              <h2 className="font-display text-sm tracking-wide text-ink">
                DOMINARIA — FALTA DEPOSITAR
              </h2>
            </div>
            {domiPending.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">Nada pendente.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {domiPending.map((r) => (
                  <li key={r.card_id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm">
                    <Link href={`/admin/cartas?finance=${r.card_id}`} className="group min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink group-hover:underline">{cardName(r)}</p>
                      <p className="text-xs text-ink-muted">
                        {r.buyer_name || "sem comprador"}
                        {r.dominaria_fee != null ? ` · taxa ${brl(num(r.dominaria_fee))}` : ""}
                      </p>
                    </Link>
                    <MarkButton kind="deposited" cardId={r.card_id} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm tracking-wide text-ink">POR COMPRADOR</h2>
            </div>
            {buyers.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">Nenhuma venda ainda.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {buyers.map((b) => (
                  <li key={b.name} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{b.name}</p>
                      <p className="text-xs text-ink-muted">
                        {b.count} carta(s) · {brl(b.total)} no total
                      </p>
                    </div>
                    {b.owed > 0 && (
                      <span className="shrink-0 font-semibold text-destructive">
                        deve {brl(b.owed)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal" />
              <h2 className="font-display text-sm tracking-wide text-ink">VENDAS RECENTES</h2>
            </div>
            {recentSales.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">Nenhuma venda registrada.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {recentSales.map((r) => (
                  <li key={r.card_id} className="flex items-center justify-between gap-3 text-sm">
                    <Link href={`/admin/cartas?finance=${r.card_id}`} className="group min-w-0 flex-1">
                      <p className="truncate text-ink group-hover:underline">{cardName(r)}</p>
                      <p className="text-xs text-ink-muted">
                        {soldWhen(r) ? new Date(soldWhen(r)!).toLocaleDateString("pt-BR") : "vendida"}
                        {r.paid_at ? " · pago" : " · a receber"}
                      </p>
                    </Link>
                    <span className="shrink-0 font-semibold text-primary">
                      {brl(num(r.final_price))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
