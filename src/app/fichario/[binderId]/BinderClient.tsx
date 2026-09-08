"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ArrowLeft,
  Pencil,
  Check,
} from "lucide-react";
import type { Binder, BinderCard } from "@/lib/supabase/types";
import { CardSearch, type SearchResult } from "@/app/admin/cartas/CardSearch";
import { addToBinder, removeFromBinder, swapBinderCards, updateGridSize, renameBinder } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GRID_SIZES: Record<string, { cols: number; rows: number; label: string }> = {
  "2x2": { cols: 2, rows: 2, label: "2×2" },
  "3x3": { cols: 3, rows: 3, label: "3×3" },
  "4x3": { cols: 4, rows: 3, label: "4×3" },
  "4x4": { cols: 4, rows: 4, label: "4×4" },
};

const COLS_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function BinderClient({ binder, initial }: { binder: Binder; initial: BinderCard[] }) {
  const [name, setName] = useState(binder.name);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(binder.name);
  const [cards, setCards] = useState(initial);
  const [gridSize, setGridSize] = useState(
    GRID_SIZES[binder.grid_size] ? binder.grid_size : "3x3"
  );
  const [page, setPage] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const { cols, rows } = GRID_SIZES[gridSize];
  const cardsPerPage = cols * rows;
  const totalPages = Math.max(1, Math.ceil(cards.length / cardsPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const pageCards = cards.slice(safePage * cardsPerPage, safePage * cardsPerPage + cardsPerPage);
  const emptySlots = cardsPerPage - pageCards.length;

  function goToPage(p: number) {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  }

  async function handleGridChange(size: string) {
    setGridSize(size);
    setPage(0);
    await updateGridSize(binder.id, size);
  }

  async function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === name) {
      setEditingName(false);
      setNameDraft(name);
      return;
    }
    setName(trimmed);
    setEditingName(false);
    await renameBinder(binder.id, trimmed);
  }

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
      const prevLen = cards.length;
      await addToBinder(binder.id, input);
      setCards((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: "",
          binder_id: binder.id,
          tcg_api_id: input.tcg_api_id,
          name: input.name,
          set_name: input.set_name,
          card_number: input.card_number,
          image_url: input.image_url,
          position: prev.length,
          created_at: new Date().toISOString(),
        },
      ]);
      setPage(Math.floor(prevLen / cardsPerPage));
      setSearchOpen(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await removeFromBinder(id);
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      const newTotalPages = Math.max(1, Math.ceil(next.length / cardsPerPage));
      setPage((p) => Math.min(p, newTotalPages - 1));
      return next;
    });
    setRemovingId(null);
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const sourceId = draggedId;
    setDraggedId(null);
    setCards((prev) => {
      const next = [...prev];
      const ia = next.findIndex((c) => c.id === sourceId);
      const ib = next.findIndex((c) => c.id === targetId);
      if (ia === -1 || ib === -1) return prev;
      const posA = next[ia].position;
      const posB = next[ib].position;
      next[ia] = { ...next[ia], position: posB };
      next[ib] = { ...next[ib], position: posA };
      next.sort((x, y) => x.position - y.position);
      return next;
    });
    swapBinderCards(sourceId, targetId);
  }

  return (
    <div>
      <Link
        href="/fichario"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todos os fichários
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="h-8 max-w-[220px] text-base"
                />
                <button
                  onClick={handleSaveName}
                  aria-label="Salvar nome"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-deep text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <h1 className="flex items-center gap-2 font-display text-2xl text-ink text-comic-shadow-sm">
                {name.toUpperCase()}
                <Badge variant="secondary" className="translate-y-px font-comic tracking-wide">
                  beta
                </Badge>
                <button
                  onClick={() => {
                    setNameDraft(name);
                    setEditingName(true);
                  }}
                  aria-label="Renomear fichário"
                  className="text-ink-muted hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </h1>
            )}
          </div>
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
          <p className="text-sm text-ink-muted">Esse fichário tá vazio. Bora adicionar a primeira carta?</p>
          <Button onClick={() => setSearchOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Adicionar carta
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-surface p-1">
              <LayoutGrid className="ml-2 h-3.5 w-3.5 text-ink-muted" />
              {Object.entries(GRID_SIZES).map(([key, g]) => (
                <button
                  key={key}
                  onClick={() => handleGridChange(key)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    gridSize === key
                      ? "bg-orange-deep text-white"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 0}
                  aria-label="Página anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-surface-alt disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-ink-muted">
                  Página {safePage + 1} de {totalPages}
                </span>
                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === totalPages - 1}
                  aria-label="Próxima página"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-surface-alt disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <motion.div
            key={`${gridSize}-${safePage}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`mt-4 grid ${COLS_CLASS[cols]} gap-3 rounded-[2rem] border-2 border-ink/10 bg-surface p-4 sm:gap-4 sm:p-8`}
          >
            <AnimatePresence initial={false}>
              {pageCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.3, delay: i < 12 ? i * 0.025 : 0 }}
                  draggable
                  onDragStart={() => setDraggedId(card.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(card.id);
                  }}
                  className={`group relative aspect-[5/7] cursor-grab overflow-hidden rounded-lg border-2 border-ink/10 bg-bg shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${
                    draggedId === card.id ? "opacity-40" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                  <img
                    src={card.image_url}
                    alt={card.name}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
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
                </motion.div>
              ))}
            </AnimatePresence>

            {/* empty slots to keep the page feeling like a real binder page */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={() => setSearchOpen(true)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                aria-label="Adicionar carta neste espaço"
                className="aspect-[5/7] rounded-lg border-2 border-dashed border-ink/10 transition-colors hover:border-orange hover:bg-orange/5"
              />
            ))}
          </motion.div>
        </>
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
