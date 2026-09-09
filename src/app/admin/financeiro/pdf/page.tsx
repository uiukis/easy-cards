import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { PrintButton } from "./PrintButton";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso.length <= 10 ? iso + "T00:00:00" : iso).toLocaleDateString("pt-BR") : "—";

type Row = {
  card_id: string;
  final_price: number | null;
  delivery_method: "maos" | "dominaria" | null;
  dominaria_fee: number | null;
  dominaria_deposited_at: string | null;
  buyer_name: string | null;
  sold_at: string | null;
  paid_at: string | null;
  notes: string | null;
  cards:
    | { name: string; set_name: string | null; card_number: string | null; condition: string | null; status: string }
    | { name: string; set_name: string | null; card_number: string | null; condition: string | null; status: string }[]
    | null;
};

const card = (r: Row) => (Array.isArray(r.cards) ? r.cards[0] : r.cards);
const isSold = (r: Row) => !!r.sold_at || card(r)?.status === "sold";
const num = (n: number | null | undefined) => Number(n) || 0;

export default async function FinanceiroPdfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/financeiro/pdf");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  if (!permissions.view_finance) redirect("/admin");

  const { data } = await supabase
    .from("card_finance")
    .select(
      "card_id, final_price, delivery_method, dominaria_fee, dominaria_deposited_at, buyer_name, sold_at, paid_at, notes, cards(name, set_name, card_number, condition, status)"
    );
  const rows = (data ?? []) as Row[];

  const sold = rows.filter(isSold);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const totalAll = sold.reduce((s, r) => s + num(r.final_price), 0);
  const totalMonth = sold
    .filter((r) => r.sold_at && new Date(r.sold_at) >= startOfMonth)
    .reduce((s, r) => s + num(r.final_price), 0);
  const receivable = sold.filter((r) => !r.paid_at);
  const receivableTotal = receivable.reduce((s, r) => s + num(r.final_price), 0);
  const domiFees = rows
    .filter((r) => r.delivery_method === "dominaria")
    .reduce((s, r) => s + num(r.dominaria_fee), 0);
  const domiPending = rows.filter(
    (r) => r.delivery_method === "dominaria" && !r.dominaria_deposited_at
  ).length;

  // Sort: unpaid sales first, then by sale date (newest first), unsold last.
  const ordered = [...rows].sort((a, b) => {
    const as = isSold(a) ? 1 : 0;
    const bs = isSold(b) ? 1 : 0;
    if (as !== bs) return bs - as;
    const ap = a.paid_at ? 1 : 0;
    const bp = b.paid_at ? 1 : 0;
    if (as && ap !== bp) return ap - bp;
    return new Date(b.sold_at ?? 0).getTime() - new Date(a.sold_at ?? 0).getTime();
  });

  const now = new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });

  const kpis = [
    { label: "Vendido total", value: brl(totalAll) },
    { label: "Vendido esse mês", value: brl(totalMonth) },
    { label: "A receber", value: brl(receivableTotal), sub: `${receivable.length} carta(s)`, warn: true },
    { label: "Taxas Dominaria", value: brl(domiFees), sub: `${domiPending} a depositar` },
  ];

  return (
    <div className="report mx-auto max-w-[900px] bg-white p-6 text-[#1c1710] sm:p-10 print:max-w-none print:p-0">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          html, body { background: #fff !important; }
          .report { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          tr { break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>

      {/* action bar — screen only */}
      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <a href="/admin/financeiro" className="text-sm font-semibold text-[#786d59] hover:text-[#1c1710]">
          ← voltar
        </a>
        <PrintButton />
      </div>

      {/* letterhead */}
      <header className="relative overflow-hidden rounded-2xl border-2 border-[#1c1710] bg-[#fbf1df] px-6 py-5">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-40"
          style={{
            backgroundImage:
              "repeating-conic-gradient(from 0deg, #ffb347 0deg 8deg, transparent 8deg 20deg)",
            WebkitMaskImage: "radial-gradient(closest-side, black 55%, transparent 100%)",
            maskImage: "radial-gradient(closest-side, black 55%, transparent 100%)",
          }}
        />
        <p
          className="font-display text-2xl tracking-wide text-[#d9660b]"
          style={{ fontFamily: "var(--font-luckiest), system-ui, sans-serif", textShadow: "1.5px 1.5px 0 #16305c" }}
        >
          EASY <span className="text-[#f2941d]">CARDS</span>
        </p>
        <h1
          className="mt-1 text-3xl font-extrabold uppercase tracking-tight text-[#1c1710]"
          style={{ fontFamily: "var(--font-luckiest), system-ui, sans-serif" }}
        >
          Relatório Financeiro
        </h1>
        <p className="mt-1 text-xs text-[#786d59]">
          Gerado em {now} · por {profile.full_name ?? "equipe"}
        </p>
      </header>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border-2 px-3 py-3 ${
              k.warn ? "border-[#d9660b] bg-[#fff3dd]" : "border-[#1c1710]/15 bg-white"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#786d59]">{k.label}</p>
            <p className="mt-1 text-lg font-extrabold text-[#1c1710]">{k.value}</p>
            {k.sub && <p className="text-[10px] text-[#786d59]">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* table */}
      <div className="mt-6 overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[720px] border-collapse text-[11px] print:min-w-0">
        <thead>
          <tr className="bg-[#1c1710] text-left text-white">
            {["Carta", "Coleção", "Comprador", "Entrega", "Preço", "Taxa Domi", "Depositado", "Vendida", "Pago"].map(
              (h) => (
                <th key={h} className="px-2 py-2 font-bold uppercase tracking-wide first:rounded-l-md last:rounded-r-md">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {ordered.length === 0 && (
            <tr>
              <td colSpan={9} className="px-2 py-6 text-center text-[#786d59]">
                Nenhum lançamento financeiro ainda.
              </td>
            </tr>
          )}
          {ordered.map((r, i) => {
            const c = card(r);
            const sold = isSold(r);
            return (
              <tr key={r.card_id} className={i % 2 ? "bg-[#fbf1df]/60" : "bg-white"}>
                <td className="px-2 py-1.5 font-semibold">
                  {c?.name ?? "Carta"}
                  {c?.card_number ? <span className="font-normal text-[#786d59]"> {c.card_number}</span> : null}
                  {c?.condition ? <span className="font-normal text-[#786d59]"> · {c.condition}</span> : null}
                </td>
                <td className="px-2 py-1.5 text-[#786d59]">{c?.set_name ?? "—"}</td>
                <td className="px-2 py-1.5">{r.buyer_name ?? "—"}</td>
                <td className="px-2 py-1.5">
                  {r.delivery_method === "dominaria"
                    ? "Dominaria"
                    : r.delivery_method === "maos"
                      ? "Em mãos"
                      : "—"}
                </td>
                <td className="px-2 py-1.5 font-semibold">{r.final_price != null ? brl(num(r.final_price)) : "—"}</td>
                <td className="px-2 py-1.5 text-[#786d59]">
                  {r.delivery_method === "dominaria" && r.dominaria_fee != null ? brl(num(r.dominaria_fee)) : "—"}
                </td>
                <td className="px-2 py-1.5">
                  {r.delivery_method === "dominaria"
                    ? r.dominaria_deposited_at
                      ? fmtDate(r.dominaria_deposited_at)
                      : "pendente"
                    : "—"}
                </td>
                <td className="px-2 py-1.5">{sold ? fmtDate(r.sold_at) : "não"}</td>
                <td className={`px-2 py-1.5 font-semibold ${sold && !r.paid_at ? "text-[#d9660b]" : ""}`}>
                  {r.paid_at ? fmtDate(r.paid_at) : sold ? "a receber" : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        {ordered.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-[#1c1710] font-extrabold">
              <td className="px-2 py-2" colSpan={4}>
                TOTAIS
              </td>
              <td className="px-2 py-2">{brl(totalAll)}</td>
              <td className="px-2 py-2">{brl(domiFees)}</td>
              <td className="px-2 py-2" />
              <td className="px-2 py-2" />
              <td className="px-2 py-2 text-[#d9660b]">{brl(receivableTotal)}</td>
            </tr>
          </tfoot>
        )}
      </table>
      </div>

      <p className="mt-6 text-center text-[10px] text-[#786d59]">
        Easy Cards · documento interno · valores em reais (BRL)
      </p>
    </div>
  );
}
