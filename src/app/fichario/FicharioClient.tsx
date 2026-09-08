"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, BookOpen } from "lucide-react";
import type { BinderCard } from "@/lib/supabase/types";
import { CardSearch, type SearchResult } from "@/app/admin/cartas/CardSearch";
import { addToBinder, removeFromBinder } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FicharioClient({ initial }: { initial: BinderCard[] }) {
  const [cards, setCards] = useState(initial);
  const [searchOpen, setSearchOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleSelect(result: SearchResult) {
    setAdding(true);
    const input = {
      tcg_api_id: result.id,
      name: result.name,
      set_name: result.setName,
      card_number: result.cardNumber,
      image_url: result.imageUrl,
    };
    try {
      await addToBinder(input);
      setCards((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: "",
          tcg_api_id: input.tcg_api_id,
          name: input.name,
          set_name: input.set_name,
          card_number: input.card_number,
          image_url: input.image_url,
          position: prev.length,
          created_at: new Date().toISOString(),
        },
      ]);
      setSearchOpen(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await removeFromBinder(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    setRemovingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl text-ink text-comic-shadow-sm">
            <BookOpen className="h-6 w-6 text-primary" />
            MEU FICHÁRIO
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monte sua vitrine de cartas — sua coleção, do seu jeito.
          </p>
        </div>
        <Button onClick={() => setSearchOpen(true)}>
          <Plus className="h-4 w-4" />
          Adicionar carta
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-halftone py-20 text-center">
          <BookOpen className="h-10 w-10 text-ink-muted" />
          <p className="text-sm text-ink-muted">Seu fichário tá vazio. Bora adicionar a primeira carta?</p>
          <Button onClick={() => setSearchOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Adicionar carta
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-3 gap-3 rounded-[2rem] border-2 border-ink/10 bg-surface p-4 sm:grid-cols-3 sm:gap-4 sm:p-8 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="group relative aspect-[5/7] overflow-hidden rounded-lg border-2 border-ink/10 bg-bg shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
              <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
              <button
                onClick={() => handleRemove(card.id)}
                disabled={removingId === card.id}
                aria-label={`Remover ${card.name}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-100"
              >
                {removingId === card.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}

          {/* empty slots to keep the last row feeling like a real binder page */}
          {Array.from({ length: (3 - (cards.length % 3)) % 3 }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-[5/7] rounded-lg border-2 border-dashed border-ink/10"
            />
          ))}
        </div>
      )}

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">BUSCAR CARTA</DialogTitle>
          </DialogHeader>
          {adding ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Adicionando...
            </div>
          ) : (
            <CardSearch onSelect={handleSelect} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
