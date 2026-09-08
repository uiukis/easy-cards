"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Check, Plus, Minus, SlidersHorizontal, X } from "lucide-react";
import type { SearchResult } from "@/app/admin/cartas/CardSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = [
  "Colorless", "Darkness", "Dragon", "Fairy", "Fighting", "Fire",
  "Grass", "Lightning", "Metal", "Psychic", "Water",
] as const;

const RARITIES = [
  "Common", "Uncommon", "Rare", "Rare Holo", "Double Rare", "Ultra Rare",
  "Illustration Rare", "Special Illustration Rare", "Hyper Rare", "Rare Secret",
] as const;

const TYPE_LABEL_PT: Record<string, string> = {
  Colorless: "Incolor", Darkness: "Escuridão", Dragon: "Dragão", Fairy: "Fada",
  Fighting: "Lutador", Fire: "Fogo", Grass: "Planta", Lightning: "Elétrico",
  Metal: "Metal", Psychic: "Psíquico", Water: "Água",
};

type TcgSet = { id: string; name: string; series: string };

export type PendingCard = SearchResult & { qty: number };

export function AddCardsDialog({
  open,
  onOpenChange,
  onConfirm,
  showPageToggle,
  currentPage,
  adding,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (cards: SearchResult[], toCurrentPage: boolean) => void;
  showPageToggle: boolean;
  currentPage: number;
  adding: boolean;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [rarity, setRarity] = useState("");
  const [setId, setSetId] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sets, setSets] = useState<TcgSet[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const [selected, setSelected] = useState<Map<string, PendingCard>>(new Map());
  const [toCurrentPage, setToCurrentPage] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // reset when closed
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setQuery("");
      setType("");
      setRarity("");
      setSetId("");
      setShowFilters(false);
      setResults([]);
      setSelected(new Map());
      setPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || sets.length > 0) return;
    fetch("/api/tcg-sets")
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .catch(() => {});
  }, [open, sets.length]);

  const hasCriteria = query.trim().length >= 2 || !!type || !!rarity || !!setId;

  useEffect(() => {
    if (!open) return;
    if (!hasCriteria) {
      queueMicrotask(() => {
        setResults([]);
        setFailed(false);
      });
      return;
    }
    const timer = setTimeout(() => runSearch(1, false), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, rarity, setId, open]);

  async function runSearch(pageNum: number, append: boolean) {
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams();
      if (query.trim().length >= 2) params.set("q", query.trim());
      if (type) params.set("type", type);
      if (rarity) params.set("rarity", rarity);
      if (setId) params.set("setId", setId);
      params.set("page", String(pageNum));
      const res = await fetch(`/api/tcg-search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setResults((prev) => (append ? [...prev, ...(data.results ?? [])] : data.results ?? []));
      setHasMore(!!data.hasMore);
      setPage(pageNum);
    } catch {
      if (!append) setResults([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function toggle(card: SearchResult) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(card.id)) next.delete(card.id);
      else next.set(card.id, { ...card, qty: 1 });
      return next;
    });
  }

  function setQty(id: string, delta: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (!cur) return prev;
      const qty = cur.qty + delta;
      if (qty <= 0) next.delete(id);
      else next.set(id, { ...cur, qty });
      return next;
    });
  }

  const totalCount = Array.from(selected.values()).reduce((s, c) => s + c.qty, 0);
  const activeFilters = [type, rarity, setId].filter(Boolean).length;

  function handleConfirm() {
    const flat: SearchResult[] = [];
    for (const c of selected.values()) {
      for (let i = 0; i < c.qty; i++) {
        const { qty, ...card } = c;
        void qty;
        flat.push(card);
      }
    }
    onConfirm(flat, showPageToggle && toCurrentPage);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">ADICIONAR CARTAS</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome da carta (ex: Charizard)"
            className="h-11 pl-9 pr-10 text-base"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Filtros"
            className={`absolute right-2.5 top-1/2 flex h-7 -translate-y-1/2 items-center gap-1 rounded-full px-2 text-xs font-bold transition-colors ${
              showFilters || activeFilters
                ? "bg-orange-deep text-white"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeFilters > 0 && activeFilters}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={type || "all"} onValueChange={(v) => setType(v && v !== "all" ? v : "")}>
              <SelectTrigger className="h-9">
                <SelectValue>{(v: string) => (v === "all" ? "Tipo" : TYPE_LABEL_PT[v] ?? v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer tipo</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABEL_PT[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={rarity || "all"} onValueChange={(v) => setRarity(v && v !== "all" ? v : "")}>
              <SelectTrigger className="h-9">
                <SelectValue>{(v: string) => (v === "all" ? "Raridade" : v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer raridade</SelectItem>
                {RARITIES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={setId || "all"} onValueChange={(v) => setSetId(v && v !== "all" ? v : "")}>
              <SelectTrigger className="h-9">
                <SelectValue>
                  {(v: string) => (v === "all" ? "Set" : sets.find((s) => s.id === v)?.name ?? "Set")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">Qualquer set</SelectItem>
                {sets.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {failed && !loading && (
            <p className="py-6 text-center text-xs text-ink-muted">
              A busca falhou (base pública instável). Tenta de novo.
            </p>
          )}
          {!hasCriteria && (
            <p className="py-10 text-center text-sm text-ink-muted">
              Busque por nome ou use os filtros.
            </p>
          )}
          {hasCriteria && !loading && results.length === 0 && !failed && (
            <p className="py-10 text-center text-sm text-ink-muted">Nenhuma carta encontrada.</p>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-2 py-1 sm:grid-cols-4">
              {results.map((c) => {
                const pick = selected.get(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c)}
                    className={`group relative overflow-hidden rounded-lg border-2 transition-colors ${
                      pick ? "border-orange-deep ring-2 ring-orange-deep" : "border-transparent hover:border-ink/20"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                    <img src={c.imageUrl} alt={c.name} className="aspect-[5/7] w-full object-cover" />
                    {pick && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-deep text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white">
                      {c.cardNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
            </div>
          )}

          {hasMore && !loading && results.length > 0 && (
            <button
              onClick={() => runSearch(page + 1, true)}
              className="my-2 w-full rounded-lg border-2 border-ink/10 py-2 text-xs font-bold text-ink-muted hover:text-ink"
            >
              Carregar mais
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="max-h-28 shrink-0 space-y-1 overflow-y-auto rounded-xl border-2 border-ink/10 p-2">
            {Array.from(selected.values()).map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate font-semibold text-ink">{c.name}</span>
                <button
                  onClick={() => setQty(c.id, -1)}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 text-ink-muted hover:text-ink"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center font-bold text-ink">{c.qty}</span>
                <button
                  onClick={() => setQty(c.id, 1)}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 text-ink-muted hover:text-ink"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => toggle(c)}
                  aria-label="Remover da seleção"
                  className="text-ink-muted hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {showPageToggle ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
              <Switch checked={toCurrentPage} onCheckedChange={setToCurrentPage} />
              Adicionar à página {currentPage}
            </label>
          ) : (
            <span />
          )}
          <Button onClick={handleConfirm} disabled={totalCount === 0 || adding} className="rounded-full">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {totalCount === 0
              ? "Selecione cartas"
              : `Adicionar ${totalCount} ${totalCount === 1 ? "carta" : "cartas"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
