"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAY_LABEL } from "@/lib/finance";

export type SaleRow = {
  cardId: string;
  name: string;
  buyer: string | null;
  price: number;
  owed: number;
  status: "aberto" | "parcial" | "pago";
  overdue: boolean;
  dueDate: string | null;
  soldAt: string | null;
  auction: string | null;
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string | null) =>
  s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR") : "—";

export function SalesTable({ rows }: { rows: SaleRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [buyer, setBuyer] = useState("all");
  const [auction, setAuction] = useState("all");

  const buyers = useMemo(
    () => [...new Set(rows.map((r) => r.buyer).filter(Boolean) as string[])].sort(),
    [rows]
  );
  const auctions = useMemo(
    () => [...new Set(rows.map((r) => r.auction).filter(Boolean) as string[])].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !`${r.name} ${r.buyer ?? ""}`.toLowerCase().includes(needle)) return false;
      if (status === "vencido" && !r.overdue) return false;
      if (status !== "all" && status !== "vencido" && r.status !== status) return false;
      if (buyer !== "all" && r.buyer !== buyer) return false;
      if (auction !== "all" && r.auction !== auction) return false;
      return true;
    });
  }, [rows, q, status, buyer, auction]);

  const totalOwed = filtered.reduce((s, r) => s + r.owed, 0);
  const active = (status !== "all" ? 1 : 0) + (buyer !== "all" ? 1 : 0) + (auction !== "all" ? 1 : 0);

  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink/10 p-3">
        <h2 className="mr-1 font-display text-sm tracking-wide text-ink">TODAS AS VENDAS</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Carta ou comprador…"
            className="h-8 w-44 pl-8 text-xs"
          />
        </div>
        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger size="sm">
            <SelectValue>
              {(v: string) =>
                v === "all" ? "Pagamento" : v === "vencido" ? "Vencidos" : PAY_LABEL[v] ?? v
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
          </SelectContent>
        </Select>
        {buyers.length > 0 && (
          <Select value={buyer} onValueChange={(v) => v && setBuyer(v)}>
            <SelectTrigger size="sm">
              <SelectValue>{(v: string) => (v === "all" ? "Comprador" : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {buyers.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {auctions.length > 0 && (
          <Select value={auction} onValueChange={(v) => v && setAuction(v)}>
            <SelectTrigger size="sm">
              <SelectValue>{(v: string) => (v === "all" ? "Leilão" : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {auctions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {active > 0 && (
          <button
            onClick={() => {
              setStatus("all");
              setBuyer("all");
              setAuction("all");
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            limpar
          </button>
        )}
        <span className="ml-auto text-xs text-ink-muted">
          {filtered.length} venda(s) · a receber {brl(totalOwed)}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="p-6 text-center text-sm text-ink-muted">Nada com esses filtros.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2 font-semibold">Carta</th>
                <th className="px-3 py-2 font-semibold">Comprador</th>
                <th className="px-3 py-2 font-semibold">Leilão</th>
                <th className="px-3 py-2 font-semibold">Prazo</th>
                <th className="px-3 py-2 text-right font-semibold">Valor</th>
                <th className="px-3 py-2 text-right font-semibold">Falta</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.cardId} className="border-b border-ink/5 last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/cartas?finance=${r.cardId}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{r.buyer || "—"}</td>
                  <td className="px-3 py-2 text-ink-muted">{r.auction || "—"}</td>
                  <td className={`px-3 py-2 ${r.overdue ? "font-semibold text-destructive" : "text-ink-muted"}`}>
                    {fmtDate(r.dueDate)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">{brl(r.price)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-destructive">
                    {r.owed > 0 ? brl(r.owed) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        r.status === "pago"
                          ? "bg-teal/10 text-teal"
                          : r.overdue
                            ? "bg-destructive/10 text-destructive"
                            : r.status === "parcial"
                              ? "bg-orange-deep/10 text-orange-deep"
                              : "bg-surface-alt text-ink-muted"
                      }`}
                    >
                      {r.overdue && r.status !== "pago" ? "vencido" : PAY_LABEL[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
