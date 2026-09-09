"use client";

import { useState } from "react";
import Link from "next/link";
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
  Image as ImageIcon,
  BookImage,
  Bookmark,
  BookmarkCheck,
  Maximize2,
  Minimize2,
  Move,
} from "lucide-react";
import type { SearchResult } from "@/app/admin/cartas/CardSearch";
import type { GuestBinder, GuestCard } from "@/lib/guest-binders";
import { uploadBinderImage } from "@/lib/binder-image";
import { AddCardsDialog } from "./AddCardsDialog";
import { BinderCover } from "./BinderCover";
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
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingLabelPage, setEditingLabelPage] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [showCover, setShowCover] = useState(!!binder.cover_enabled);
  const [uploadingBg, setUploadingBg] = useState(false);

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

  const pageBackgrounds = binder.page_backgrounds ?? {};
  const coverStats = {
    total: binder.cards.length,
    have: binder.cards.filter((c) => !c.want && !c.is_image).length,
    want: binder.cards.filter((c) => c.want && !c.is_image).length,
    images: binder.cards.filter((c) => c.is_image).length,
    pages: totalPages,
  };

  function toggleWant(id: string) {
    setCards(binder.cards.map((c) => (c.id === id ? { ...c, want: !c.want } : c)));
  }

  function toggleSpan(id: string) {
    setCards(
      binder.cards.map((c) => {
        if (c.id !== id) return c;
        const cols = c.span_cols ?? 1;
        const rows = c.span_rows ?? 1;
        if (cols <= 1 && rows <= 1) return { ...c, span_cols: 2, span_rows: 1 };
        if (cols === 2 && rows <= 1) return { ...c, span_cols: 2, span_rows: 2 };
        return { ...c, span_cols: 1, span_rows: 1 };
      })
    );
  }

  async function handleSetPageBackground(file: File, pageIndex: number) {
    setUploadingBg(true);
    try {
      const url = await uploadBinderImage(file);
      patch({ page_backgrounds: { ...pageBackgrounds, [String(pageIndex)]: url } });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não deu pra enviar a imagem.");
    } finally {
      setUploadingBg(false);
    }
  }
  function clearPageBackground(pageIndex: number) {
    const next = { ...pageBackgrounds };
    delete next[String(pageIndex)];
    patch({ page_backgrounds: next });
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

  // Tap-to-move — the touch-friendly path (native drag doesn't fire on phones).
  function placePicked(targetCardId: string | null) {
    const src = pickedId;
    if (!src) return;
    setPickedId(null);
    if (targetCardId === src) return;
    if (targetCardId) {
      const to = binder.cards.findIndex((c) => c.id === targetCardId);
      if (to !== -1) moveCard(src, to);
    } else {
      moveCard(src, safePage * cardsPerPage + pageCards.length);
    }
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
          <Button
            variant={binder.cover_enabled && showCover ? "default" : "outline"}
            onClick={() => {
              if (!binder.cover_enabled) {
                patch({ cover_enabled: true });
                setShowCover(true);
              } else {
                setShowCover((v) => !v);
              }
            }}
          >
            <ImageIcon className="h-4 w-4" />
            Capa
          </Button>
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

      {binder.cover_enabled && showCover && (
        <div className="mt-5 print:hidden">
          <BinderCover
            name={binder.name}
            subtitle={binder.cover_subtitle ?? null}
            imageUrl={binder.cover_image_url ?? null}
            stats={coverStats}
            editable
            onSubtitleChange={(v) => patch({ cover_subtitle: v || null })}
            onImageChange={(url) => patch({ cover_image_url: url })}
          />
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={() => {
                patch({ cover_enabled: false });
                setShowCover(false);
              }}
              className="text-xs font-semibold text-ink-muted hover:text-ink"
            >
              desativar capa
            </button>
            <Link
              href="/cadastro?next=/fichario"
              className="text-xs font-semibold text-primary hover:underline"
            >
              criar conta pra salvar de verdade →
            </Link>
          </div>
        </div>
      )}

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

          <div className="mb-2 mt-4 flex items-center justify-center gap-2 print:hidden">
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
            {editingLabelPage !== safePage &&
              (pageBackgrounds[String(safePage)] ? (
                <button
                  onClick={() => clearPageBackground(safePage)}
                  className="flex items-center gap-1 text-xs font-bold text-orange-deep hover:text-ink"
                >
                  <BookImage className="h-3 w-3" /> tirar fundo
                </button>
              ) : (
                <label className="flex cursor-pointer items-center gap-1 text-xs font-bold text-ink-muted opacity-60 hover:text-ink hover:opacity-100">
                  {uploadingBg ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <BookImage className="h-3 w-3" />
                  )}{" "}
                  fundo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSetPageBackground(f, safePage);
                      e.target.value = "";
                    }}
                  />
                </label>
              ))}
          </div>

          <motion.div
            key={`${gridSize}-${safePage}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={
              pageBackgrounds[String(safePage)]
                ? {
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url(${JSON.stringify(
                      pageBackgrounds[String(safePage)]
                    )})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
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
                onClick={() => {
                  if (pickedId) placePicked(card.id);
                  else setFocusedId((f) => (f === card.id ? null : card.id));
                }}
                style={{
                  ...((card.span_cols ?? 1) > 1 ? { gridColumn: `span ${card.span_cols}` } : {}),
                  ...((card.span_rows ?? 1) > 1 ? { gridRow: `span ${card.span_rows}` } : {}),
                }}
                className={`group relative aspect-[5/7] overflow-hidden rounded-lg border-2 bg-bg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  pickedId ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                } ${
                  dragOverId === card.id || pickedId === card.id
                    ? "border-orange-deep ring-2 ring-orange-deep"
                    : pickedId
                      ? "border-orange/40"
                      : card.want && !card.is_image
                        ? "border-dashed border-orange/70"
                        : "border-ink/10"
                } ${draggedId === card.id || pickedId === card.id ? "opacity-40" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                <img
                  src={card.image_url}
                  alt={card.name}
                  draggable={false}
                  className={`h-full w-full object-cover ${
                    card.want && !card.is_image ? "opacity-45 saturate-50" : ""
                  }`}
                />
                {card.want && !card.is_image && (
                  <span className="pointer-events-none absolute left-0 top-2 bg-orange-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Quero
                  </span>
                )}
                {(() => {
                  const vis =
                    focusedId === card.id ? "opacity-100" : "opacity-0 group-hover:opacity-100";
                  return (
                    <>
                      {!card.is_image && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWant(card.id);
                          }}
                          aria-label={card.want ? "Tenho essa carta" : "Quero essa carta"}
                          title={card.want ? "Marcar como: Tenho" : "Marcar como: Quero"}
                          className={`absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm transition-opacity ${
                            card.want ? "bg-orange-deep text-white" : `bg-black/60 text-white ${vis}`
                          }`}
                        >
                          {card.want ? (
                            <BookmarkCheck className="h-2.5 w-2.5" />
                          ) : (
                            <Bookmark className="h-2.5 w-2.5" />
                          )}
                          {card.want ? "Quero" : "Tenho"}
                        </button>
                      )}
                      <div className={`absolute left-1 top-1 flex gap-1 transition-opacity ${vis}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickedId(card.id);
                            setFocusedId(null);
                          }}
                          aria-label={`Mover ${card.name}`}
                          title="Mover — depois toque no lugar"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                        >
                          <Move className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSpan(card.id);
                          }}
                          aria-label="Mudar o tamanho do slot"
                          title="Normal → largura dupla → 2×2 (toploader)"
                          className="flex h-6 items-center gap-0.5 rounded-full bg-black/60 px-1.5 text-white backdrop-blur-sm"
                        >
                          {(card.span_cols ?? 1) > 1 || (card.span_rows ?? 1) > 1 ? (
                            <Minimize2 className="h-3.5 w-3.5" />
                          ) : (
                            <Maximize2 className="h-3.5 w-3.5" />
                          )}
                          {(card.span_cols ?? 1) > 1 && (
                            <span className="text-[9px] font-bold">
                              {(card.span_rows ?? 1) > 1 ? "2×2" : "2×1"}
                            </span>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(card.id);
                        }}
                        aria-label={`Remover ${card.name}`}
                        className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity ${vis}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  );
                })()}
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
                onClick={() => pickedId && i === 0 && placePicked(null)}
                className={`group/slot relative flex aspect-[5/7] items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  dragOverId === `empty-${i}` || (pickedId && i === 0)
                    ? "border-orange-deep bg-orange/10"
                    : "border-ink/10"
                } ${pickedId && i === 0 ? "cursor-pointer" : ""}`}
              >
                {pickedId && i === 0 ? (
                  <span className="px-2 text-center text-[10px] font-bold text-orange-deep">
                    toque pra soltar aqui
                  </span>
                ) : uploading && i === 0 ? (
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

          {binder.cards.length >= 3 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border-2 border-orange/30 bg-orange/10 px-3 py-2 text-center text-xs text-ink print:hidden">
              <span className="font-semibold text-orange-deep">
                {binder.cards.length} cartas nesse fichário
              </span>
              <span className="text-ink-muted">
                — some se você limpar o navegador. Leva 30 segundos pra garantir.
              </span>
              <Link
                href="/cadastro?next=/fichario"
                className="font-bold text-primary hover:underline"
              >
                Criar conta grátis →
              </Link>
            </div>
          )}

          {/* print: all pages */}
          <div className="hidden print:block">
            {binder.cover_enabled && (
              <div className="break-after-page">
                {binder.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- uploaded cover art
                  <img
                    src={binder.cover_image_url}
                    alt=""
                    className="mb-4 max-h-[60vh] w-full rounded-xl object-cover"
                  />
                )}
                <h1 className="font-display text-3xl tracking-wide text-ink">
                  {binder.name.toUpperCase()}
                </h1>
                {binder.cover_subtitle && (
                  <p className="mt-1 text-sm text-ink-muted">{binder.cover_subtitle}</p>
                )}
              </div>
            )}
            {pages.map((pc, pi) => (
              <div key={pi} className={pi < pages.length - 1 ? "break-after-page" : ""}>
                {binder.page_labels[String(pi)] && (
                  <p className="mb-2 font-display text-lg text-ink">
                    {binder.page_labels[String(pi)]}
                  </p>
                )}
                <div
                  className={`grid ${COLS_CLASS[cols]} gap-2 rounded-xl p-2`}
                  style={
                    pageBackgrounds[String(pi)]
                      ? {
                          backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${JSON.stringify(
                            pageBackgrounds[String(pi)]
                          )})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  {pc.map((card) => (
                    <div
                      key={card.id}
                      style={{
                        ...((card.span_cols ?? 1) > 1 ? { gridColumn: `span ${card.span_cols}` } : {}),
                        ...((card.span_rows ?? 1) > 1 ? { gridRow: `span ${card.span_rows}` } : {}),
                      }}
                      className={`relative aspect-[5/7] overflow-hidden rounded-lg border border-ink/20 ${
                        card.want && !card.is_image ? "opacity-60" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                      <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
                      {card.want && !card.is_image && (
                        <span className="absolute left-0 top-1 bg-orange-deep px-1 text-[8px] font-bold uppercase text-white">
                          Quero
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pickedId && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
          <div className="flex items-center gap-3 rounded-full border-2 border-orange-deep bg-surface px-4 py-2.5 shadow-xl">
            <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Move className="h-4 w-4 text-orange-deep" />
              Toque no lugar onde quer colocar
            </span>
            <Button size="sm" variant="outline" onClick={() => setPickedId(null)}>
              Cancelar
            </Button>
          </div>
        </div>
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
