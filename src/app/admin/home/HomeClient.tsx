"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, Loader2, X, Brush, Check } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { HoloShine } from "@/components/HoloShine";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SITE_NAV } from "@/lib/site-nav";
import { setCardOfWeek, setNavHidden, type CardOfWeek } from "./actions";

type Hit = {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  imageSmall: string;
  imageLarge: string;
  artist: string | null;
  rarity: string | null;
};

export function HomeClient({
  initial,
  navHidden,
}: {
  initial: CardOfWeek;
  navHidden: string[];
}) {
  const [current, setCurrent] = useState(initial);
  const [note, setNote] = useState(initial?.note ?? "");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, start] = useTransition();
  const first = useRef(true);

  const [hidden, setHidden] = useState<string[]>(navHidden);
  function toggleNav(href: string, show: boolean) {
    const next = show ? hidden.filter((h) => h !== href) : [...new Set([...hidden, href])];
    setHidden(next);
    start(() => setNavHidden(next));
  }

  useEffect(() => {
    if (q.trim().length < 2) {
      queueMicrotask(() => setHits([]));
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/tcg-gallery?q=${encodeURIComponent(q.trim())}`);
        const d = await r.json();
        setHits(d.results ?? []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    first.current = false;
    return () => clearTimeout(t);
  }, [q]);

  function choose(h: Hit) {
    const next: CardOfWeek = {
      tcg_id: h.id,
      name: h.name,
      set_name: h.setName,
      card_number: h.cardNumber,
      image_large: h.imageLarge,
      artist: h.artist,
      note,
    };
    setCurrent(next);
    setQ("");
    setHits([]);
    start(() => setCardOfWeek(next));
  }

  function saveNote() {
    if (!current) return;
    const next = { ...current, note };
    setCurrent(next);
    start(() => setCardOfWeek(next));
  }

  function clear() {
    setCurrent(null);
    setNote("");
    start(() => setCardOfWeek(null));
  }

  return (
    <div>
      <AdminPageHeader
        title="PÁGINA INICIAL"
        subtitle="Conteúdo que a equipe escolhe pra vitrine da home."
      />

      <div className="mt-6 max-w-xl space-y-4">
        <h2 className="font-display text-lg tracking-wide text-ink">CARTA DA SEMANA</h2>

        {current ? (
          <div className="flex gap-4 rounded-2xl border-2 border-ink/10 bg-surface p-4">
            <div className="relative w-28 shrink-0 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
              <img src={current.image_large} alt={current.name} className="w-full" />
              <HoloShine kind="special" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{current.name}</p>
              <p className="text-xs text-ink-muted">
                {current.set_name} · {current.card_number}
              </p>
              {current.artist && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                  <Brush className="h-3 w-3 text-primary" />
                  {current.artist}
                </p>
              )}
              <button
                onClick={clear}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
              >
                <X className="h-3 w-3" /> tirar da home
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-ink/15 bg-surface/60 p-4 text-sm text-ink-muted">
            Nenhuma carta em destaque. Busca abaixo e escolhe uma.
          </p>
        )}

        {current && (
          <div className="space-y-1.5">
            <Label>Comentário (opcional)</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Por que essa carta? A arte, a raridade, a história…"
            />
            <Button size="sm" variant="outline" onClick={saveNote} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salvar comentário
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label>{current ? "Trocar a carta" : "Escolher a carta"}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar carta na base do TCG…"
              className="pl-9"
            />
          </div>
          {loading && (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando…
            </p>
          )}
          {hits.length > 0 && (
            <div className="grid grid-cols-4 gap-2 rounded-xl border-2 border-ink/10 bg-surface p-2 sm:grid-cols-5">
              {hits.slice(0, 15).map((h) => (
                <button
                  key={h.id}
                  onClick={() => choose(h)}
                  className="overflow-hidden rounded-md border-2 border-transparent transition-colors hover:border-orange-deep"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                  <img src={h.imageSmall} alt={h.name} className="aspect-[5/7] w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 max-w-xl space-y-4">
        <div>
          <h2 className="font-display text-lg tracking-wide text-ink">MENU DO SITE</h2>
          <p className="mt-1 text-sm text-ink-muted">
            O que aparece no menu da página inicial (topo no computador, gaveta no celular).
            Desligar aqui não apaga a página — só tira o link do menu.
          </p>
        </div>

        <ul className="divide-y divide-ink/10 rounded-2xl border-2 border-ink/10 bg-surface">
          {SITE_NAV.map((link) => {
            const shown = !hidden.includes(link.href);
            return (
              <li key={link.href} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{link.label}</p>
                  <p className="truncate font-mono text-[11px] text-ink-muted">{link.href}</p>
                </div>
                <Switch
                  checked={shown}
                  disabled={busy}
                  onCheckedChange={(v) => toggleNav(link.href, v)}
                  aria-label={`Mostrar ${link.label} no menu`}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
