import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Wallet, Clock, Truck, Users, FileText, Pencil, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { MonthClose } from "./MonthClose";
import { Card, CardContent } from "@/components/ui/card";
import { MarkButton } from "./QuickActions";
import { SalesTable, type SaleRow } from "./SalesTable";
import { owed as owedOf, isOverdue } from "@/lib/finance";

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
  payment_status: "aberto" | "parcial" | "pago";
  amount_paid: number | null;
  due_date: string | null;
  auction_label: string | null;
  buyer_disputed_at: string | null;
  consignor_name: string | null;
  commission_pct: number | null;
  consignor_paid_at: string | null;
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
      "card_id, final_price, delivery_method, dominaria_fee, dominaria_deposited_at, buyer_id, buyer_name, sold_at, paid_at, payment_status, amount_paid, due_date, auction_label, buyer_disputed_at, consignor_name, commission_pct, consignor_paid_at, cards(name, status)"
    );
  const rows = (data ?? []) as FinRow[];
  const owed = (r: FinRow) =>
    owedOf({
      final_price: r.final_price,
      amount_paid: r.amount_paid,
      payment_status: r.payment_status,
    });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sold = rows.filter(isSold);
  const num = (n: number | null | undefined) => Number(n) || 0;

  const totalAll = sold.reduce((s, r) => s + num(r.final_price), 0);
  const totalMonth = sold
    .filter((r) => soldWhen(r) && new Date(soldWhen(r)!) >= startOfMonth)
    .reduce((s, r) => s + num(r.final_price), 0);

  const receivable = sold.filter((r) => r.payment_status !== "pago");
  const receivableTotal = receivable.reduce((s, r) => s + owed(r), 0);
  const overdue = receivable.filter((r) => isOverdue(r));

  const disputed = rows.filter((r) => r.buyer_disputed_at);

  const consignOwed = sold.filter(
    (r) => r.consignor_name && r.payment_status === "pago" && !r.consignor_paid_at
  );
  const consignShare = (r: FinRow) =>
    num(r.final_price) * (1 - num(r.commission_pct) / 100);
  const consignTotal = consignOwed.reduce((s, r) => s + consignShare(r), 0);

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
    cur.owed += owed(r);
    byBuyer.set(key, cur);
  }
  const buyers = [...byBuyer.values()].sort((a, b) => b.owed - a.owed || b.total - a.total);

  const recentSales = [...sold]
    .sort((a, b) => new Date(soldWhen(b) ?? 0).getTime() - new Date(soldWhen(a) ?? 0).getTime())
    .slice(0, 8);

  const saleRows: SaleRow[] = sold.map((r) => ({
    cardId: r.card_id,
    name: cardName(r),
    buyer: r.buyer_name,
    price: num(r.final_price),
    owed: owed(r),
    status: r.payment_status,
    overdue: isOverdue(r),
    dueDate: r.due_date,
    soldAt: soldWhen(r),
    auction: r.auction_label,
  }));

  const kpis = [
    { label: "Vendido esse mês", value: brl(totalMonth), icon: TrendingUp, color: "text-teal" },
    { label: "Vendido total", value: brl(totalAll), icon: Wallet, color: "text-ink" },
    {
      label: "A receber",
      value: brl(receivableTotal),
      icon: Clock,
      color: "text-destructive",
      hint:
        overdue.length > 0
          ? `${receivable.length} carta(s) · ${overdue.length} vencida(s)`
          : `${receivable.length} carta(s)`,
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

      <MonthClose />

      {disputed.length > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-destructive">
            <ShieldAlert className="h-4 w-4" />
            {disputed.length} compra(s) que o comprador diz não ter feito
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {disputed.map((r) => (
              <li key={r.card_id} className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{cardName(r)}</span>
                <span className="shrink-0 text-xs text-ink-muted">
                  vinculada a {r.buyer_name || "?"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-muted">
            Confere quem é o comprador certo em <span className="font-semibold">Cartas → Financeiro</span>.
          </p>
        </div>
      )}

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
                  .sort((a, b) => {
                    const ao = isOverdue(a) ? 1 : 0;
                    const bo = isOverdue(b) ? 1 : 0;
                    if (ao !== bo) return bo - ao;
                    return new Date(soldWhen(a) ?? 0).getTime() - new Date(soldWhen(b) ?? 0).getTime();
                  })
                  .map((r) => (
                    <li key={r.card_id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm">
                      <Link href={`/admin/cartas?finance=${r.card_id}`} className="group min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink group-hover:underline">
                          {cardName(r)}
                          {r.payment_status === "parcial" && (
                            <span className="ml-1.5 rounded-full bg-orange-deep/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-deep">
                              parcial
                            </span>
                          )}
                          {isOverdue(r) && (
                            <span className="ml-1.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                              vencido
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {r.buyer_name || "sem comprador"}
                          {r.due_date
                            ? ` · prazo ${new Date(`${r.due_date}T00:00:00`).toLocaleDateString("pt-BR")}`
                            : soldWhen(r)
                              ? ` · vendida há ${daysSince(soldWhen(r)!)}`
                              : ""}
                        </p>
                      </Link>
                      <span className="shrink-0 font-semibold text-destructive">
                        {brl(owed(r))}
                        {r.payment_status === "parcial" && (
                          <span className="ml-1 text-[10px] font-normal text-ink-muted">
                            de {brl(num(r.final_price))}
                          </span>
                        )}
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

        {consignOwed.length > 0 && (
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-deep" />
                <h2 className="font-display text-sm tracking-wide text-ink">
                  A REPASSAR (CONSIGNAÇÃO) · {brl(consignTotal)}
                </h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {consignOwed.map((r) => (
                  <li
                    key={r.card_id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <Link href={`/admin/cartas?finance=${r.card_id}`} className="group min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink group-hover:underline">
                        {cardName(r)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {r.consignor_name}
                        {r.commission_pct != null ? ` · ${r.commission_pct}% comissão` : ""}
                      </p>
                    </Link>
                    <span className="shrink-0 font-semibold text-orange-deep">
                      {brl(consignShare(r))}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

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
                        {r.payment_status === "pago"
                          ? " · pago"
                          : r.payment_status === "parcial"
                            ? " · parcial"
                            : " · a receber"}
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

      <div className="mt-8">
        <SalesTable rows={saleRows} />
      </div>
    </div>
  );
}
