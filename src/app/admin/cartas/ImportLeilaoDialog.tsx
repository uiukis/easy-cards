"use client";

import { useMemo, useState } from "react";
import { Loader2, AlertTriangle, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PAY_LABEL } from "@/lib/finance";
import { parseAndMatch, importAuctionRows, type MatchedRow } from "./importActions";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ImportLeilaoDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: (added: number) => void;
}) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<MatchedRow[] | null>(null);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [label, setLabel] = useState("");
  const [soldDate, setSoldDate] = useState(today);
  const [dueDate, setDueDate] = useState("");

  async function analyze(merge = false) {
    setAnalyzing(true);
    setErr(null);
    try {
      const res = await parseAndMatch(text);
      setRows((prev) => {
        if (!merge || !prev) return res;
        // keep what we already matched, fill in the ones that just resolved
        return res.map((r, i) => (prev[i]?.match ? prev[i] : r));
      });
      if (!merge) setSkip(new Set());
      if (!label) {
        const d = new Date(soldDate);
        setLabel(`Leilão ${d.getUTCDate()}/${d.getUTCMonth() + 1}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra analisar.");
    } finally {
      setAnalyzing(false);
    }
  }

  const keep = useMemo(
    () => (rows ?? []).filter((_, i) => !skip.has(i)),
    [rows, skip]
  );
  const unmatched = keep.filter((r) => !r.match).length;
  const total = keep.reduce((s, r) => s + (r.free ? 0 : r.price ?? 0), 0);

  async function doImport() {
    if (!rows) return;
    setImporting(true);
    setErr(null);
    try {
      const payload = keep.map((r) => ({
        buyer: r.buyer,
        price: r.price,
        free: r.free,
        paymentStatus: r.paymentStatus,
        notes: r.notes,
        card: r.match ?? {
          tcg_api_id: "",
          name: r.name,
          set_name: "",
          card_number: r.number,
          image_url: "",
          rarity: null,
        },
      }));
      const res = await importAuctionRows(payload, {
        auctionLabel: label,
        soldDate,
        dueDate,
      });
      onDone(res.added);
      onOpenChange(false);
      setText("");
      setRows(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não deu pra importar.");
    } finally {
      setImporting(false);
    }
  }

  function toggleSkip(i: number) {
    setSkip((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:!max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wide">
            <Upload className="h-5 w-5 text-primary" />
            IMPORTAR LEILÃO
          </DialogTitle>
        </DialogHeader>

        {!rows ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">
              Cola a lista de cartas do leilão da planilha (colunas: comprador, carta, valor,
              pagamento, obs). Cada linha vira uma carta vendida no catálogo + registro no
              financeiro. Eu tento achar a arte de cada carta na base do TCG.
            </p>
            <Textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Victor Alves\tWimpod 025/078\tR$ 2,00\tX\nSâmya\tLunatone 034/078\tR$ 3,00\n..."}
              className="font-mono text-xs"
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button
              onClick={() => analyze(false)}
              disabled={analyzing || text.trim().length < 3}
              className="w-full"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Analisar {text.trim() ? `(${text.trim().split(/\r?\n/).filter(Boolean).length} linhas)` : ""}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome do leilão</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data da venda</Label>
                <Input type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prazo pra pagar</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            {unmatched > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-orange-deep/10 p-2 text-xs text-orange-deep">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">
                  {unmatched} carta(s) sem arte — entram assim mesmo, só sem imagem (a API do TCG
                  falha às vezes; tenta de novo).
                </span>
                <button
                  onClick={() => analyze(true)}
                  disabled={analyzing}
                  className="shrink-0 rounded-full border border-orange-deep/40 px-2 py-0.5 font-bold hover:bg-orange-deep/10 disabled:opacity-50"
                >
                  {analyzing ? "..." : "Tentar de novo"}
                </button>
              </div>
            )}

            <div className="max-h-[45vh] overflow-y-auto rounded-xl border-2 border-ink/10">
              <table className="w-full text-xs">
                <tbody>
                  {rows.map((r, i) => {
                    const skipped = skip.has(i);
                    return (
                      <tr
                        key={i}
                        className={`border-b border-ink/5 last:border-0 ${skipped ? "opacity-40" : ""}`}
                      >
                        <td className="p-1.5">
                          <Switch checked={!skipped} onCheckedChange={() => toggleSkip(i)} />
                        </td>
                        <td className="w-9 p-1.5">
                          {r.match?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- external card art
                            <img src={r.match.image_url} alt="" className="h-11 w-8 rounded object-cover" />
                          ) : (
                            <div className="flex h-11 w-8 items-center justify-center rounded bg-surface-alt text-ink-muted">
                              ?
                            </div>
                          )}
                        </td>
                        <td className="p-1.5">
                          <p className="font-semibold text-ink">
                            {r.match?.name ?? r.name}
                            {r.number && <span className="ml-1 font-normal text-ink-muted">{r.number}</span>}
                          </p>
                          <p className="text-ink-muted">
                            {r.match?.set_name || (r.match ? "" : "sem correspondência")}
                            {r.ambiguous && " · vários resultados"}
                          </p>
                        </td>
                        <td className="p-1.5 text-ink-muted">{r.buyer || "—"}</td>
                        <td className="p-1.5 text-right font-semibold text-ink">
                          {r.free ? "grátis" : r.price != null ? brl(r.price) : "—"}
                        </td>
                        <td className="p-1.5">
                          <span
                            className={`rounded-full px-1.5 py-0.5 font-bold ${
                              r.paymentStatus === "pago"
                                ? "bg-teal/10 text-teal"
                                : r.paymentStatus === "parcial"
                                  ? "bg-orange-deep/10 text-orange-deep"
                                  : "bg-surface-alt text-ink-muted"
                            }`}
                          >
                            {PAY_LABEL[r.paymentStatus]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {err && <p className="text-sm text-destructive">{err}</p>}

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setRows(null)} disabled={importing}>
                Voltar
              </Button>
              <Button onClick={doImport} disabled={importing || keep.length === 0} className="flex-1">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar {keep.length} carta(s) · {brl(total)}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
