"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ArrowLeft,
  Pencil,
  Check,
  Printer,
  Loader2,
} from "lucide-react";
import type { SearchResult } from "@/app/admin/cartas/CardSearch";
import type { GuestBinder, GuestCard } from "@/lib/guest-binders";
import { uploadBinderImage } from "@/lib/binder-image";
import { AddCardsDialog } from "./AddCardsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GRID_SIZES: Record<string, { cols: number; rows: number; label: string }> = {
  "2x2": { cols: 2, rows: 2, label: "2×2" },
  "3x3": { cols: 3, rows: 3, label: "3×3" },
  "4x3": { cols: 4, rows: 3, label: "4×3" },
  "4x4": { cols: 4, rows: 4, label: "4×4" },
  "4x5": { cols: 4, rows: 5, label: "4×5" },
  "5x4": { cols: 5, rows: 4, label: "5×4" },
};
const COLS_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length > 0 ? out : [[]];
}

function toGuestCard(r: SearchResult): GuestCard {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    tcg_api_id: r.id,
    name: r.name,
    set_name: r.setName,
    card_number: r.cardNumber,
    image_url: r.imageUrl,
    rarity: r.rarity ?? null,
    types: r.types ?? null,
  };
}

export function GuestBinderClient({
  binder,
  onChange,
  onBack,
}: {
  binder: GuestBinder;
  onChange: (b: GuestBinder) => void;
  onBack: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(binder.name);
  const [page, setPage] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingLabelPage, setEditingLabelPage] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  const gridSize = GRID_SIZES[binder.grid_size] ? binder.grid_size : "3x3";
  const { cols } = GRID_SIZES[gridSize];
  const cardsPerPage = GRID_SIZES[gridSize].cols * GRID_SIZES[gridSize].rows;
  const pages = chunk(binder.cards, cardsPerPage);
  const totalPages = pages.length;
  const safePage = Math.min(page, totalPages - 1);
  const pageCards = pages[safePage] ?? [];
  const emptySlots = cardsPerPage - pageCards.length;

  function patch(p: Partial<GuestBinder>) {
    onChange({ ...binder, ...p });
  }

  function setCards(cards: GuestCard[]) {
    patch({ cards });
  }

  function handleSaveName() {
    const t = nameDraft.trim();
    setEditingName(false);
    if (t && t !== binder.name) patch({ name: t });
    else setNameDraft(binder.name);
  }

  function saveLabel(pageIndex: number) {
    const t = labelDraft.trim();
    const next = { ...binder.page_labels };
    if (t) next[String(pageIndex)] = t;
    else delete next[String(pageIndex)];
    patch({ page_labels: next });
    setEditingLabelPage(null);
  }

  function handleAdd(picked: SearchResult[], toCurrentPage: boolean) {
    const newCards = picked.map(toGuestCard);
    if (toCurrentPage && pageCards.length < cardsPerPage) {
      const at = safePage * cardsPerPage + pageCards.length;
      const next = [...binder.cards];
      next.splice(at, 0, ...newCards);
      setCards(next);
    } else {
      setCards([...binder.cards, ...newCards]);
      setPage(Math.floor((binder.cards.length + newCards.length - 1) / cardsPerPage));
    }
    setSearchOpen(false);
  }

  function handleRemove(id: string) {
    setCards(binder.cards.filter((c) => c.id !== id));
  }

  async function handleAddImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadBinderImage(file);
      const slot: GuestCard = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `c_${Date.now()}`,
        tcg_api_id: null,
        name: "Imagem",
        set_name: null,
        card_number: null,
        image_url: url,
        rarity: null,
        types: null,
        is_image: true,
      };
      if (pageCards.length < cardsPerPage) {
        const at = safePage * cardsPerPage + pageCards.length;
        const next = [...binder.cards];
        next.splice(at, 0, slot);
        setCards(next);
      } else {
        setCards([...binder.cards, slot]);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não deu pra enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  function moveCard(sourceId: string, targetIndex: number) {
    const from = binder.cards.findIndex((c) => c.id === sourceId);
    if (from === -1) return;
    const next = [...binder.cards];
    const [moved] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, moved);
    setCards(next);
  }

  function handleDropOnCard(targetId: string) {
    const src = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!src || src === targetId) return;
    const to = binder.cards.findIndex((c) => c.id === targetId);
    if (to !== -1) moveCard(src, to);
  }

  function handleDropOnEmpty() {
    const src = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!src) return;
    moveCard(src, safePage * cardsPerPage + pageCards.length);
  }

  const label = binder.page_labels[String(safePage)];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todos os fichários
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
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
              {binder.name.toUpperCase()}
              <button
                onClick={() => {
                  setNameDraft(binder.name);
                  setEditingName(true);
                }}
                aria-label="Renomear"
                className="text-ink-muted hover:text-ink"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </h1>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={() => setSearchOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar carta
          </Button>
        </div>
      </div>

      {binder.cards.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-halftone py-16 text-center print:hidden">
          <BookOpen className="h-10 w-10 text-ink-muted" />
          <p className="text-sm text-ink-muted">Fichário vazio. Bora adicionar a primeira carta?</p>
          <Button onClick={() => setSearchOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Adicionar carta
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-surface p-1">
              <LayoutGrid className="ml-2 h-3.5 w-3.5 text-ink-muted" />
              {Object.entries(GRID_SIZES).map(([key, g]) => (
                <button
                  key={key}
                  onClick={() => {
                    patch({ grid_size: key });
                    setPage(0);
                  }}
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
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  aria-label="Página anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink hover:bg-surface-alt disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-ink-muted">
                  Página {safePage + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                  disabled={safePage >= totalPages - 1}
                  aria-label="Próxima página"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink hover:bg-surface-alt disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mb-2 mt-4 flex items-center justify-center print:hidden">
            {editingLabelPage === safePage ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveLabel(safePage)}
                  placeholder={`Rótulo da página ${safePage + 1}`}
                  className="h-7 max-w-[200px] text-xs"
                />
                <button
                  onClick={() => saveLabel(safePage)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-deep text-white"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setLabelDraft(label ?? "");
                  setEditingLabelPage(safePage);
                }}
                className="text-xs font-bold text-ink-muted hover:text-ink"
              >
                {label || "+ rótulo"}
              </button>
            )}
          </div>

          <motion.div
            key={`${gridSize}-${safePage}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`grid ${COLS_CLASS[cols]} gap-3 rounded-[2rem] border-2 border-ink/10 bg-surface p-4 sm:gap-4 sm:p-8 print:hidden`}
          >
            {pageCards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => {
                  setDraggedId(card.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", card.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                onDragOver={(e) => {
                  if (!draggedId || draggedId === card.id) return;
                  e.preventDefault();
                  setDragOverId(card.id);
                }}
                onDragLeave={() => setDragOverId((c) => (c === card.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnCard(card.id);
                }}
                className={`group relative aspect-[5/7] cursor-grab overflow-hidden rounded-lg border-2 bg-bg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${
                  dragOverId === card.id ? "border-orange-deep ring-2 ring-orange-deep" : "border-ink/10"
                } ${draggedId === card.id ? "opacity-30" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                <img
                  src={card.image_url}
                  alt={card.name}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleRemove(card.id)}
                  aria-label={`Remover ${card.name}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                onDragOver={(e) => {
                  if (!draggedId) return;
                  e.preventDefault();
                  setDragOverId(`empty-${i}`);
                }}
                onDragLeave={() => setDragOverId((c) => (c === `empty-${i}` ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnEmpty();
                }}
                className={`group/slot relative flex aspect-[5/7] items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  dragOverId === `empty-${i}` ? "border-orange-deep bg-orange/10" : "border-ink/10"
                }`}
              >
                {uploading && i === 0 ? (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover/slot:opacity-100">
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="rounded-full bg-orange-deep px-2.5 py-1 text-[10px] font-bold text-white"
                    >
                      + Carta
                    </button>
                    <label className="cursor-pointer rounded-full border-2 border-ink/15 bg-surface px-2.5 py-1 text-[10px] font-bold text-ink hover:bg-surface-alt">
                      + Imagem
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAddImage(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* print: all pages */}
          <div className="hidden print:block">
            {pages.map((pc, pi) => (
              <div key={pi} className={pi < pages.length - 1 ? "break-after-page" : ""}>
                {binder.page_labels[String(pi)] && (
                  <p className="mb-2 font-display text-lg text-ink">
                    {binder.page_labels[String(pi)]}
                  </p>
                )}
                <div className={`grid ${COLS_CLASS[cols]} gap-2`}>
                  {pc.map((card) => (
                    <div
                      key={card.id}
                      className="aspect-[5/7] overflow-hidden rounded-lg border border-ink/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                      <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AddCardsDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onConfirm={handleAdd}
        showPageToggle={totalPages > 1}
        currentPage={safePage + 1}
        adding={false}
      />
    </div>
  );
}
