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
  Tag,
  Share2,
  ArrowDownUp,
  Copy,
  CheckSquare,
  X,
  FolderInput,
  Maximize2,
  Minimize2,
  Rows3,
  Printer,
} from "lucide-react";
import type { Binder, BinderCard } from "@/lib/supabase/types";
import { CardSearch, type SearchResult } from "@/app/admin/cartas/CardSearch";
import {
  addToBinder,
  removeFromBinder,
  swapBinderCards,
  updateGridSize,
  renameBinder,
  setBinderShared,
  reorderBinder,
  updateCardVariant,
  updateCardSpan,
  bulkDeleteCards,
  moveCardsToBinder,
  listOtherBinders,
  reorderPages,
} from "../actions";
import { PriceBadge } from "../PriceBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS: Record<string, string> = {
  custom: "Personalizado",
  name: "Nome (A-Z)",
  set: "Set",
  number: "Número",
};

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

const VARIANT_LABEL: Record<string, string> = {
  normal: "Normal",
  reverse_holo: "Reverse Holo",
  holo: "Holo",
  first_edition: "1ª Edição",
};

const VARIANT_ABBR: Record<string, string> = {
  normal: "",
  reverse_holo: "RH",
  holo: "H",
  first_edition: "1ED",
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length > 0 ? out : [[]];
}

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
  const [showPrices, setShowPrices] = useState(true);
  const [sortKey, setSortKey] = useState("custom");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(binder.share_enabled);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/b/${binder.id}` : `/b/${binder.id}`;

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [otherBinders, setOtherBinders] = useState<{ id: string; name: string }[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);

  const { cols, rows } = GRID_SIZES[gridSize];
  const cardsPerPage = cols * rows;
  const pages = chunk(cards, cardsPerPage);
  const totalPages = pages.length;
  const safePage = Math.min(page, totalPages - 1);
  const pageCards = pages[safePage] ?? [];
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

  function handleSort(key: string) {
    setSortKey(key);
    if (key === "custom") return;
    const sorted = [...cards].sort((a, b) => {
      if (key === "name") return a.name.localeCompare(b.name);
      if (key === "set") return (a.set_name ?? "").localeCompare(b.set_name ?? "");
      if (key === "number") {
        const na = parseInt(a.card_number?.split("/")[0] ?? "0", 10) || 0;
        const nb = parseInt(b.card_number?.split("/")[0] ?? "0", 10) || 0;
        return na - nb;
      }
      return 0;
    });
    setCards(sorted);
    reorderBinder(
      binder.id,
      sorted.map((c) => c.id)
    );
  }

  async function handleShareToggle(v: boolean) {
    setSharing(true);
    setShareEnabled(v);
    await setBinderShared(binder.id, v);
    setSharing(false);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
          variant: null,
          span_cols: 1,
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

  function handleVariantChange(cardId: string, variant: string) {
    const value = variant === "normal" ? null : variant;
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, variant: value } : c)));
    updateCardVariant(cardId, value);
  }

  function handleToggleSpan(cardId: string, current: number) {
    const next = current > 1 ? 1 : 2;
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, span_cols: next } : c)));
    updateCardSpan(cardId, next);
  }

  function toggleSelectMode() {
    if (selectMode) {
      setSelectMode(false);
      setSelectedIds(new Set());
      return;
    }
    setSelectMode(true);
    setSelectedIds(new Set());
    listOtherBinders(binder.id).then(setOtherBinders);
  }

  function toggleCardSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    await bulkDeleteCards(ids);
    setCards((prev) => prev.filter((c) => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    setBulkBusy(false);
    setConfirmBulkDelete(false);
  }

  async function handleBulkMove(targetId: string) {
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    await moveCardsToBinder(ids, targetId);
    setCards((prev) => prev.filter((c) => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    setBulkBusy(false);
    setMoveOpen(false);
  }

  function handleOverviewClick(pageIndex: number) {
    if (swapFrom === null) {
      setSwapFrom(pageIndex);
      return;
    }
    if (swapFrom === pageIndex) {
      setSwapFrom(null);
      return;
    }
    const newPages = [...pages];
    [newPages[swapFrom], newPages[pageIndex]] = [newPages[pageIndex], newPages[swapFrom]];
    const flat = newPages.flat();
    setCards(flat.map((c, i) => ({ ...c, position: i })));
    reorderPages(
      binder.id,
      newPages.map((p) => p.map((c) => c.id))
    );
    setSwapFrom(null);
  }

  return (
    <div>
      <Link
        href="/fichario"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todos os fichários
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={toggleSelectMode}
          >
            {selectMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            {selectMode ? "Cancelar" : "Selecionar"}
          </Button>
          <Button variant="outline" onClick={() => setOverviewOpen(true)}>
            <Rows3 className="h-4 w-4" />
            Páginas
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
          <Button onClick={() => setSearchOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar carta
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-halftone py-20 text-center print:hidden">
          <BookOpen className="h-10 w-10 text-ink-muted" />
          <p className="text-sm text-ink-muted">Esse fichário tá vazio. Bora adicionar a primeira carta?</p>
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

            <button
              onClick={() => setShowPrices((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                showPrices
                  ? "border-orange bg-orange/10 text-orange-deep"
                  : "border-ink/10 text-ink-muted hover:text-ink"
              }`}
              title="Preço de referência via Liga Pokémon"
            >
              <Tag className="h-3.5 w-3.5" />
              Preços
            </button>

            <Select value={sortKey} onValueChange={(v) => v && handleSort(v)}>
              <SelectTrigger className="h-auto rounded-full border-2 border-ink/10 py-1.5">
                <ArrowDownUp className="h-3.5 w-3.5 text-ink-muted" />
                <SelectValue>{(v: string) => SORT_OPTIONS[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
            className={`mt-4 grid ${COLS_CLASS[cols]} gap-3 rounded-[2rem] border-2 border-ink/10 bg-surface p-4 sm:gap-4 sm:p-8 print:hidden`}
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
                  draggable={!selectMode}
                  onDragStart={() => setDraggedId(card.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(card.id);
                  }}
                  onClick={() => selectMode && toggleCardSelected(card.id)}
                  style={card.span_cols > 1 ? { gridColumn: `span ${card.span_cols}` } : undefined}
                  className={`group relative aspect-[5/7] overflow-hidden rounded-lg border-2 bg-bg shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${
                    selectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                  } ${
                    selectedIds.has(card.id)
                      ? "border-orange-deep ring-2 ring-orange-deep"
                      : "border-ink/10"
                  } ${draggedId === card.id ? "opacity-40" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                  <img
                    src={card.image_url}
                    alt={card.name}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />

                  {selectMode ? (
                    <div
                      className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selectedIds.has(card.id)
                          ? "border-orange-deep bg-orange-deep text-white"
                          : "border-white/70 bg-black/40"
                      }`}
                    >
                      {selectedIds.has(card.id) && <Check className="h-3 w-3" />}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSpan(card.id, card.span_cols);
                      }}
                      aria-label={card.span_cols > 1 ? "Desfazer carta grande" : "Marcar como carta grande"}
                      title={card.span_cols > 1 ? "Desfazer carta grande" : "Carta grande (2 espaços)"}
                      className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    >
                      {card.span_cols > 1 ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  {!selectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(card.id);
                      }}
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
                  )}

                  {showPrices && (
                    <div className="absolute bottom-1 left-1">
                      <PriceBadge name={card.name} cardNumber={card.card_number} />
                    </div>
                  )}

                  {!selectMode && (
                    <div onClick={(e) => e.stopPropagation()} className="absolute bottom-1 right-1">
                      <Select
                        value={card.variant ?? "normal"}
                        onValueChange={(v) => v && handleVariantChange(card.id, v)}
                      >
                        <SelectTrigger className="h-5 min-w-0 gap-0.5 rounded-full border-0 bg-black/60 px-1.5 py-0 text-[9px] font-bold text-white backdrop-blur-sm [&_svg]:h-2.5 [&_svg]:w-2.5">
                          <SelectValue>{(v: string) => VARIANT_ABBR[v] || "···"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VARIANT_LABEL).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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

          {/* print-only: every page, one per sheet */}
          <div className="hidden print:block">
            {pages.map((pc, pi) => (
              <div
                key={pi}
                className={`grid ${COLS_CLASS[cols]} gap-2 ${pi < pages.length - 1 ? "break-after-page" : ""}`}
              >
                {pc.map((card) => (
                  <div
                    key={card.id}
                    style={card.span_cols > 1 ? { gridColumn: `span ${card.span_cols}` } : undefined}
                    className="aspect-[5/7] overflow-hidden rounded-lg border border-ink/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                    <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {selectMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
          <div className="flex items-center gap-3 rounded-full border-2 border-ink/10 bg-surface px-4 py-2.5 shadow-xl">
            <span className="text-sm font-bold text-ink">{selectedIds.size} selecionada(s)</span>
            <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)} disabled={bulkBusy}>
              <FolderInput className="h-3.5 w-3.5" />
              Mover
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkBusy}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          </div>
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

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">COMPARTILHAR</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/10 p-3">
              <div>
                <p className="text-sm font-semibold text-ink">Link público</p>
                <p className="text-xs text-ink-muted">Qualquer pessoa com o link pode ver, sem conta.</p>
              </div>
              <Switch checked={shareEnabled} onCheckedChange={handleShareToggle} disabled={sharing} />
            </label>

            {shareEnabled && (
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopyLink} aria-label="Copiar link">
                  {copied ? <Check className="h-4 w-4 text-teal" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">MOVER PARA...</DialogTitle>
          </DialogHeader>
          {otherBinders.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Você precisa de outro fichário pra mover cartas. Crie um novo primeiro.
            </p>
          ) : (
            <div className="space-y-1.5">
              {otherBinders.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBulkMove(b.id)}
                  disabled={bulkBusy}
                  className="flex w-full items-center justify-between rounded-lg border-2 border-ink/10 px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-surface-alt disabled:opacity-50"
                >
                  {b.name}
                  {bulkBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={overviewOpen} onOpenChange={(v) => { setOverviewOpen(v); if (!v) setSwapFrom(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">VISÃO GERAL DAS PÁGINAS</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-ink-muted">
            Clique numa página pra abrir. Clique em duas seguidas pra trocar elas de lugar.
          </p>
          <div className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {pages.map((pc, pi) => (
              <button
                key={pi}
                onClick={() => {
                  if (swapFrom !== null) {
                    handleOverviewClick(pi);
                  } else {
                    setPage(pi);
                    setOverviewOpen(false);
                  }
                }}
                className={`rounded-xl border-2 p-2 text-left transition-colors ${
                  swapFrom === pi ? "border-orange-deep bg-orange/10" : "border-ink/10 hover:bg-surface-alt"
                }`}
              >
                <div className="grid grid-cols-2 gap-0.5">
                  {pc.slice(0, 4).map((c) => (
                    // eslint-disable-next-line @next/next/no-img-element -- external card art URLs
                    <img key={c.id} src={c.image_url} alt="" className="aspect-[5/7] w-full rounded-sm object-cover" />
                  ))}
                  {Array.from({ length: Math.max(0, 4 - pc.length) }).map((_, i) => (
                    <div key={`e-${i}`} className="aspect-[5/7] w-full rounded-sm bg-surface-alt" />
                  ))}
                </div>
                <p className="mt-1.5 text-xs font-bold text-ink">Página {pi + 1}</p>
                <p className="text-[10px] text-ink-muted">{pc.length} cartas</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setSwapFrom(null)}
            className={`text-xs font-semibold text-ink-muted hover:text-ink ${swapFrom === null ? "invisible" : ""}`}
          >
            Cancelar troca
          </button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Remover ${selectedIds.size} carta(s)?`}
        description="Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        destructive
        loading={bulkBusy}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
