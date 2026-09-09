"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, Loader2, X, Brush } from "lucide-react";
import { HoloShine } from "@/components/HoloShine";
import { AddToBinderButton } from "@/app/minhas-cartas/AddToBinderButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GalleryCard = {
  id: string;
  name: string;
  setName: string;
  series: string;
  imageSmall: string;
  imageLarge: string;
  cardNumber: string;
  rarity: string | null;
  types: string | null;
  artist: string | null;
  flavorText: string | null;
};

type TcgSet = { id: string; name: string; series: string };

const TYPES = [
  "Colorless", "Darkness", "Dragon", "Fairy", "Fighting", "Fire",
  "Grass", "Lightning", "Metal", "Psychic", "Water",
] as const;
const TYPE_PT: Record<string, string> = {
  Colorless: "Incolor", Darkness: "Escuridão", Dragon: "Dragão", Fairy: "Fada",
  Fighting: "Lutador", Fire: "Fogo", Grass: "Planta", Lightning: "Elétrico",
  Metal: "Metal", Psychic: "Psíquico", Water: "Água",
};
const RARITIES = [
  "Common", "Uncommon", "Rare", "Rare Holo", "Double Rare", "Ultra Rare",
  "Illustration Rare", "Special Illustration Rare", "Hyper Rare", "Rare Secret",
] as const;

function holoKind(rarity: string | null): "holo" | "reverse" | "special" | null {
  if (!rarity) return null;
  const r = rarity.toLowerCase();
  if (/(secret|hyper|rainbow|special illustration)/.test(r)) return "special";
  if (/(holo|illustration|ultra|rare ex|gx|vmax|vstar| v\b|double rare)/.test(r)) return "holo";
  return null;
}

export function GaleriaClient({
  binders,
  loggedIn,
}: {
  binders: { id: string; name: string }[];
  loggedIn: boolean;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [rarity, setRarity] = useState("");
  const [setId, setSetId] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sets, setSets] = useState<TcgSet[]>([]);
  const [cards, setCards] = useState<GalleryCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<GalleryCard | null>(null);

  useEffect(() => {
    fetch("/api/tcg-sets")
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .catch(() => {});
  }, []);

  const run = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      setFailed(false);
      try {
        const p = new URLSearchParams();
        if (q.trim().length >= 2) p.set("q", q.trim());
        if (type) p.set("type", type);
        if (rarity) p.set("rarity", rarity);
        if (setId) p.set("setId", setId);
        p.set("page", String(pageNum));
        const res = await fetch(`/api/tcg-gallery?${p}`);
        const data = await res.json();
        if (!res.ok) throw new Error();
        setCards((prev) => (append ? [...prev, ...(data.results ?? [])] : data.results ?? []));
        setHasMore(!!data.hasMore);
        setTotal(data.total ?? 0);
        setIsDefault(!!data.isDefault);
        setPage(pageNum);
      } catch {
        if (!append) setCards([]);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [q, type, rarity, setId]
  );

  // debounced search on any criteria change
  const first = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => run(1, false), first.current ? 0 : 400);
    first.current = false;
    return () => clearTimeout(t);
  }, [run]);

  const activeFilters = [type, rarity, setId].filter(Boolean).length;

  return (
    <>
      <section className="bg-halftone bg-bg">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <p className="font-comic text-sm text-primary">Galeria</p>
          <h1 className="mt-1 font-display text-4xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-5xl">
            TODA CARTA POKÉMON
          </h1>
          <p className="mt-3 max-w-xl text-ink-muted">
            A base completa do TCG. Busca por nome, set, tipo e raridade — vê a arte em alta e quem
            ilustrou.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Charizard, Pikachu, Mew…"
                className="h-11 pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex h-11 items-center gap-1.5 rounded-lg border-2 px-3.5 text-sm font-bold transition-colors ${
                showFilters || activeFilters
                  ? "border-orange-deep bg-orange-deep text-white"
                  : "border-ink/15 text-ink-muted hover:text-ink"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros{activeFilters ? ` (${activeFilters})` : ""}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Select value={type || "all"} onValueChange={(v) => setType(v && v !== "all" ? v : "")}>
                <SelectTrigger className="h-10">
                  <SelectValue>{(v: string) => (v === "all" ? "Tipo" : TYPE_PT[v] ?? v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer tipo</SelectItem>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_PT[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={rarity || "all"} onValueChange={(v) => setRarity(v && v !== "all" ? v : "")}>
                <SelectTrigger className="h-10">
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
                <SelectTrigger className="h-10">
                  <SelectValue>
                    {(v: string) => (v === "all" ? "Set" : sets.find((s) => s.id === v)?.name ?? "Set")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Qualquer set</SelectItem>
                  {sets.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setType("");
                    setRarity("");
                    setSetId("");
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" /> limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {!loading && cards.length > 0 && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {isDefault ? "✨ Cartas em destaque" : `${total.toLocaleString("pt-BR")} carta(s)`}
          </p>
        )}

        {failed && !loading && (
          <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-surface/60 p-8 text-center text-sm text-ink-muted">
            A base pública tá instável agora.{" "}
            <button
              onClick={() => run(1, false)}
              className="font-semibold text-primary hover:underline"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {!failed && cards.length === 0 && !loading && (
          <p className="rounded-2xl border-2 border-dashed border-ink/15 bg-surface/60 p-8 text-center text-sm text-ink-muted">
            Nenhuma carta encontrada.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((c, i) => (
            <motion.button
              key={`${c.id}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min((i % 24) * 0.02, 0.3) }}
              onClick={() => setOpen(c)}
              className="group relative overflow-hidden rounded-lg border-2 border-ink/10 bg-bg shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
              <img
                src={c.imageSmall}
                alt={c.name}
                loading="lazy"
                className="aspect-[5/7] w-full object-cover"
              />
              {holoKind(c.rarity) && <HoloShine kind={holoKind(c.rarity)!} />}
            </motion.button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        )}

        {hasMore && !loading && cards.length > 0 && (
          <button
            onClick={() => run(page + 1, true)}
            className="mx-auto mt-6 block rounded-full border-2 border-ink/15 px-6 py-2.5 text-sm font-bold text-ink hover:bg-surface-alt"
          >
            Carregar mais
          </button>
        )}
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:!max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wide">
                  {open.name.toUpperCase()}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 sm:grid-cols-[minmax(0,240px)_1fr]">
                <div className="relative mx-auto w-full max-w-[240px] overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                  <img src={open.imageLarge} alt={open.name} className="w-full" />
                  {holoKind(open.rarity) && <HoloShine kind={holoKind(open.rarity)!} />}
                </div>
                <div className="space-y-2.5 text-sm">
                  <Row label="Set">
                    {open.setName}
                    {open.series ? ` · ${open.series}` : ""}
                  </Row>
                  <Row label="Número">{open.cardNumber}</Row>
                  {open.rarity && <Row label="Raridade">{open.rarity}</Row>}
                  {open.types && <Row label="Tipo">{open.types.split(",").map((t) => TYPE_PT[t] ?? t).join(", ")}</Row>}
                  {open.artist && (
                    <Row label="Ilustração">
                      <span className="inline-flex items-center gap-1.5">
                        <Brush className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {open.artist}
                      </span>
                    </Row>
                  )}
                  {open.flavorText && (
                    <p className="mt-2 border-l-2 border-ink/15 pl-3 text-xs italic text-ink-muted">
                      {open.flavorText}
                    </p>
                  )}

                  <div className="pt-2">
                    {loggedIn ? (
                      <AddToBinderButton
                        binders={binders}
                        card={{
                          tcg_api_id: open.id,
                          name: open.name,
                          set_name: open.setName,
                          card_number: open.cardNumber,
                          image_url: open.imageSmall,
                        }}
                      />
                    ) : (
                      <Link
                        href="/fichario"
                        className="inline-flex items-center gap-1.5 rounded-full bg-orange-deep px-4 py-2 text-xs font-bold text-white"
                      >
                        Montar um fichário com essa carta
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="w-20 shrink-0 font-semibold text-ink-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </p>
  );
}
