"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowLeft, Layers, Sparkles, FileStack } from "lucide-react";
import { createBinder, type NewBinderCard } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TcgSet = {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  releaseDate: string;
  symbolUrl: string;
};

type PokemonGroup = { name: string; count: number };
type PokemonCard = {
  id: string;
  name: string;
  setName: string;
  imageUrl: string;
  cardNumber: string;
  rarity?: string | null;
  types?: string | null;
};

type Mode = "choose" | "blank" | "set" | "pokemon";

function toNewBinderCard(c: PokemonCard): NewBinderCard {
  return {
    tcg_api_id: c.id,
    name: c.name,
    set_name: c.setName,
    card_number: c.cardNumber,
    image_url: c.imageUrl,
    rarity: c.rarity ?? null,
    types: c.types ?? null,
  };
}

export function NewBinderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [creating, setCreating] = useState(false);

  // blank
  const [blankName, setBlankName] = useState("Meu Fichário");
  const [blankDesc, setBlankDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  // set wizard
  const [sets, setSets] = useState<TcgSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [setQuery, setSetQuery] = useState("");
  const [selectedSet, setSelectedSet] = useState<TcgSet | null>(null);
  const [setCards, setSetCards] = useState<PokemonCard[]>([]);
  const [setCardsLoading, setSetCardsLoading] = useState(false);
  const [setName, setSetName] = useState("");

  // pokemon wizard
  const [pokemonQuery, setPokemonQuery] = useState("");
  const [pokemonLoading, setPokemonLoading] = useState(false);
  const [pokemonGroups, setPokemonGroups] = useState<PokemonGroup[]>([]);
  const [pokemonCards, setPokemonCards] = useState<PokemonCard[]>([]);
  const [pokemonTotalCount, setPokemonTotalCount] = useState(0);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [pokemonName, setPokemonName] = useState("");

  function reset() {
    setMode("choose");
    setError(null);
    setBlankName("Meu Fichário");
    setBlankDesc("");
    setSetQuery("");
    setSelectedSet(null);
    setSetCards([]);
    setSetName("");
    setPokemonQuery("");
    setPokemonGroups([]);
    setPokemonCards([]);
    setPokemonTotalCount(0);
    setSelectedGroups(new Set());
    setPokemonName("");
  }

  useEffect(() => {
    if (!open) {
      const t = setTimeout(reset, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (mode !== "set" || sets.length > 0) return;
    queueMicrotask(() => setSetsLoading(true));
    fetch("/api/tcg-sets")
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .finally(() => setSetsLoading(false));
  }, [mode, sets.length]);

  useEffect(() => {
    if (!selectedSet) return;
    queueMicrotask(() => {
      setSetCardsLoading(true);
      setSetName(selectedSet.name);
    });
    fetch(`/api/tcg-set-cards?setId=${encodeURIComponent(selectedSet.id)}`)
      .then((r) => r.json())
      .then((d) => setSetCards((d.cards ?? []).map((c: PokemonCard) => c)))
      .finally(() => setSetCardsLoading(false));
  }, [selectedSet]);

  useEffect(() => {
    if (mode !== "pokemon" || pokemonQuery.trim().length < 2) {
      queueMicrotask(() => {
        setPokemonGroups([]);
        setPokemonCards([]);
      });
      return;
    }
    const timer = setTimeout(() => {
      setPokemonLoading(true);
      fetch(`/api/tcg-pokemon-search?name=${encodeURIComponent(pokemonQuery.trim())}`)
        .then((r) => r.json())
        .then((d) => {
          setPokemonGroups(d.groups ?? []);
          setPokemonCards(d.cards ?? []);
          setPokemonTotalCount(d.totalCount ?? 0);
          setSelectedGroups(new Set((d.groups ?? []).map((g: PokemonGroup) => g.name)));
          const trimmed = pokemonQuery.trim();
          setPokemonName(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
        })
        .finally(() => setPokemonLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [pokemonQuery, mode]);

  function toggleGroup(name: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const selectedPokemonCards = pokemonCards.filter((c) => selectedGroups.has(c.name));

  async function handleCreate(
    name: string,
    gridSize: string,
    cards?: PokemonCard[],
    description?: string,
    setTotal?: number
  ) {
    setCreating(true);
    setError(null);
    try {
      const binder = await createBinder({
        name: name.trim() || "Meu Fichário",
        description,
        gridSize,
        setTotal,
        cards: cards?.map(toNewBinderCard),
      });
      onOpenChange(false);
      router.push(`/fichario/${binder.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu pra criar o fichário.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">
            {mode === "choose" && "NOVO FICHÁRIO"}
            {mode === "blank" && "FICHÁRIO EM BRANCO"}
            {mode === "set" && "COLEÇÃO COMPLETA"}
            {mode === "pokemon" && "UM POKÉMON"}
          </DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid gap-2.5">
            <button
              onClick={() => setMode("blank")}
              className="flex items-center gap-3 rounded-xl border-2 border-ink/10 bg-surface p-4 text-left transition-colors hover:border-orange hover:bg-orange/5"
            >
              <FileStack className="h-5 w-5 shrink-0 text-orange-deep" />
              <div>
                <p className="font-semibold text-ink">Vazio</p>
                <p className="text-xs text-ink-muted">Começa do zero e você adiciona as cartas.</p>
              </div>
            </button>
            <button
              onClick={() => setMode("set")}
              className="flex items-center gap-3 rounded-xl border-2 border-ink/10 bg-surface p-4 text-left transition-colors hover:border-orange hover:bg-orange/5"
            >
              <Layers className="h-5 w-5 shrink-0 text-orange-deep" />
              <div>
                <p className="font-semibold text-ink">Coleção completa</p>
                <p className="text-xs text-ink-muted">Adiciona todas as cartas de um set de uma vez.</p>
              </div>
            </button>
            <button
              onClick={() => setMode("pokemon")}
              className="flex items-center gap-3 rounded-xl border-2 border-ink/10 bg-surface p-4 text-left transition-colors hover:border-orange hover:bg-orange/5"
            >
              <Sparkles className="h-5 w-5 shrink-0 text-orange-deep" />
              <div>
                <p className="font-semibold text-ink">Um Pokémon</p>
                <p className="text-xs text-ink-muted">Busca um Pokémon e adiciona as cartas dele que você escolher.</p>
              </div>
            </button>
          </div>
        )}

        {mode === "blank" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("choose")}
              className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
            <div className="space-y-1.5">
              <Label>Nome do fichário</Label>
              <Input
                autoFocus
                value={blankName}
                onChange={(e) => setBlankName(e.target.value)}
                placeholder="Ex: Trade binder"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <textarea
                rows={2}
                value={blankDesc}
                onChange={(e) => setBlankDesc(e.target.value)}
                placeholder="Pra que é esse fichário?"
                className="w-full resize-none rounded-lg border-2 border-ink/15 bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-orange-deep"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              className="w-full"
              disabled={creating}
              onClick={() => handleCreate(blankName, "3x3", undefined, blankDesc)}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar fichário
            </Button>
          </div>
        )}

        {mode === "set" && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setSelectedSet(null);
                setMode("choose");
              }}
              className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>

            {!selectedSet ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    autoFocus
                    value={setQuery}
                    onChange={(e) => setSetQuery(e.target.value)}
                    placeholder="Buscar set (ex: Evolving Skies)"
                    className="pl-9"
                  />
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {setsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando sets...
                    </div>
                  ) : (
                    sets
                      .filter(
                        (s) =>
                          !setQuery.trim() ||
                          s.name.toLowerCase().includes(setQuery.trim().toLowerCase()) ||
                          s.series.toLowerCase().includes(setQuery.trim().toLowerCase())
                      )
                      .slice(0, 40)
                      .map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSet(s)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-alt"
                        >
                          <span className="text-ink">{s.name}</span>
                          <span className="shrink-0 text-xs text-ink-muted">{s.printedTotal} cartas</span>
                        </button>
                      ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border-2 border-ink/10 bg-surface p-3">
                  <p className="font-semibold text-ink">{selectedSet.name}</p>
                  <p className="text-xs text-ink-muted">
                    {setCardsLoading ? "Carregando cartas..." : `${setCards.length} cartas`}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Nome do fichário</Label>
                  <Input value={setName} onChange={(e) => setSetName(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  className="w-full"
                  disabled={creating || setCardsLoading || setCards.length === 0}
                  onClick={() =>
                    handleCreate(setName, "4x4", setCards, undefined, selectedSet.printedTotal)
                  }
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar fichário · {setCards.length} cartas
                </Button>
              </>
            )}
          </div>
        )}

        {mode === "pokemon" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("choose")}
              className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                autoFocus
                value={pokemonQuery}
                onChange={(e) => setPokemonQuery(e.target.value)}
                placeholder="Nome do Pokémon (ex: Charizard)"
                className="pl-9 pr-9"
              />
              {pokemonLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" />
              )}
            </div>

            {pokemonGroups.length > 0 && (
              <>
                <p className="text-xs text-ink-muted">
                  {pokemonTotalCount} cartas encontradas
                  {pokemonTotalCount > pokemonCards.length && ` (mostrando as ${pokemonCards.length} primeiras)`}
                  . Escolha quais formas entram:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pokemonGroups.map((g) => (
                    <button
                      key={g.name}
                      onClick={() => toggleGroup(g.name)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        selectedGroups.has(g.name)
                          ? "bg-orange-deep text-white"
                          : "border-2 border-ink/10 text-ink-muted hover:text-ink"
                      }`}
                    >
                      {g.name} {g.count}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label>Nome do fichário</Label>
                  <Input value={pokemonName} onChange={(e) => setPokemonName(e.target.value)} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  className="w-full"
                  disabled={creating || selectedPokemonCards.length === 0}
                  onClick={() => handleCreate(pokemonName, "4x4", selectedPokemonCards)}
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar fichário · {selectedPokemonCards.length} cartas
                </Button>
              </>
            )}

            {!pokemonLoading && pokemonQuery.trim().length >= 2 && pokemonGroups.length === 0 && (
              <p className="py-4 text-center text-sm text-ink-muted">Nenhuma carta encontrada.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
