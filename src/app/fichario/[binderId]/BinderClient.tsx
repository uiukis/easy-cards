"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  BookText,
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
  Undo2,
  Redo2,
} from "lucide-react";
import type { Binder, BinderCard } from "@/lib/supabase/types";
import { PRICES_ENABLED } from "@/lib/features";
import type { SearchResult } from "@/app/admin/cartas/CardSearch";
import { AddCardsDialog } from "../AddCardsDialog";
import {
  addManyToBinder,
  removeFromBinder,
  updateGridSize,
  renameBinder,
  updateBinderDescription,
  updatePageLabels,
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
  rarity: "Raridade",
  type: "Tipo",
};

// Rough rarity ranking so "sort by rarity" puts the chase cards last.
const RARITY_RANK: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  "rare holo": 3,
  "double rare": 4,
  "rare holo ex": 5,
  "rare holo gx": 5,
  "rare holo v": 5,
  "rare holo vmax": 6,
  "rare holo vstar": 6,
  "ultra rare": 7,
  "illustration rare": 8,
  "special illustration rare": 9,
  "rare secret": 10,
  "hyper rare": 10,
  "rare rainbow": 10,
};

function rarityRank(r: string | null): number {
  if (!r) return -1;
  return RARITY_RANK[r.toLowerCase()] ?? 3.5;
}

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
  const [description, setDescription] = useState(binder.description ?? "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(binder.description ?? "");
  const [page, setPage] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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

  const [viewMode, setViewMode] = useState<"single" | "spread">("single");
  const [pageLabels, setPageLabels] = useState<Record<string, string>>(
    binder.page_labels ?? {}
  );
  const [editingLabelPage, setEditingLabelPage] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  // arrangement undo/redo — stacks of card-id orders
  const [past, setPast] = useState<string[][]>([]);
  const [futureOrders, setFutureOrders] = useState<string[][]>([]);

  const { cols, rows } = GRID_SIZES[gridSize];
  const cardsPerPage = cols * rows;
  const pages = chunk(cards, cardsPerPage);
  const totalPages = pages.length;
  const safePage = Math.min(page, totalPages - 1);

  function goToPage(p: number) {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  }

  // --- arrangement history ---------------------------------------------------
  function snapshot() {
    setPast((p) => [...p.slice(-24), cards.map((c) => c.id)]);
    setFutureOrders([]);
  }
  function clearHistory() {
    setPast([]);
    setFutureOrders([]);
  }
  function applyOrder(order: string[]) {
    setCards((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]));
      const next = order
        .map((id) => byId.get(id))
        .filter((c): c is BinderCard => !!c);
      for (const c of prev) if (!order.includes(c.id)) next.push(c);
      return next.map((c, i) => ({ ...c, position: i }));
    });
    reorderBinder(binder.id, order);
  }
  function undo() {
    if (past.length === 0) return;
    const prevOrder = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFutureOrders((f) => [cards.map((c) => c.id), ...f].slice(0, 25));
    applyOrder(prevOrder);
  }
  function redo() {
    if (futureOrders.length === 0) return;
    const nextOrder = futureOrders[0];
    setFutureOrders((f) => f.slice(1));
    setPast((p) => [...p, cards.map((c) => c.id)].slice(-25));
    applyOrder(nextOrder);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selectMode || editingName || editingDesc || editingLabelPage !== null) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // --- page labels ---------------------------------------------------------
  function saveLabel(pageIndex: number) {
    const trimmed = labelDraft.trim();
    const next = { ...pageLabels };
    if (trimmed) next[String(pageIndex)] = trimmed;
    else delete next[String(pageIndex)];
    setPageLabels(next);
    setEditingLabelPage(null);
    updatePageLabels(binder.id, next);
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

  async function handleSaveDesc() {
    const trimmed = descDraft.trim();
    setDescription(trimmed);
    setEditingDesc(false);
    if (trimmed !== (description ?? "")) {
      await updateBinderDescription(binder.id, trimmed);
    }
  }

  function handleSort(key: string) {
    setSortKey(key);
    if (key === "custom") return;
    snapshot();
    const sorted = [...cards].sort((a, b) => {
      if (key === "name") return a.name.localeCompare(b.name);
      if (key === "set") return (a.set_name ?? "").localeCompare(b.set_name ?? "");
      if (key === "number") {
        const na = parseInt(a.card_number?.split("/")[0] ?? "0", 10) || 0;
        const nb = parseInt(b.card_number?.split("/")[0] ?? "0", 10) || 0;
        return na - nb;
      }
      if (key === "rarity") {
        const diff = rarityRank(a.rarity) - rarityRank(b.rarity);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      if (key === "type") {
        const ta = a.types?.split(",")[0] ?? "";
        const tb = b.types?.split(",")[0] ?? "";
        return ta.localeCompare(tb) || a.name.localeCompare(b.name);
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

  async function handleAddMany(picked: SearchResult[], toCurrentPage: boolean) {
    if (picked.length === 0) return;
    clearHistory();
    setAdding(true);
    try {
      const pageStart = safePage * cardsPerPage;
      const onPage = cards.slice(pageStart, pageStart + cardsPerPage).length;
      const atIndex =
        toCurrentPage && onPage < cardsPerPage ? pageStart + onPage : undefined;

      const payload = picked.map((c) => ({
        tcg_api_id: c.id,
        name: c.name,
        set_name: c.setName,
        card_number: c.cardNumber,
        image_url: c.imageUrl,
        rarity: c.rarity ?? null,
        types: c.types ?? null,
      }));
      const { ids } = await addManyToBinder(binder.id, payload, atIndex);

      const newCards: BinderCard[] = picked.map((c, i) => ({
        id: ids[i] ?? crypto.randomUUID(),
        user_id: "",
        binder_id: binder.id,
        tcg_api_id: c.id,
        name: c.name,
        set_name: c.setName,
        card_number: c.cardNumber,
        image_url: c.imageUrl,
        position: 0,
        variant: null,
        span_cols: 1,
        rarity: c.rarity ?? null,
        types: c.types ?? null,
        created_at: new Date().toISOString(),
      }));

      setCards((prev) => {
        const insertAt = atIndex ?? prev.length;
        const next = [...prev];
        next.splice(insertAt, 0, ...newCards);
        return next.map((card, i) => ({ ...card, position: i }));
      });
      if (atIndex == null) {
        setPage(Math.floor((cards.length + newCards.length - 1) / cardsPerPage));
      }
      setSearchOpen(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    clearHistory();
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

  function moveCard(sourceId: string, targetIndex: number) {
    snapshot();
    setCards((prev) => {
      const from = prev.findIndex((c) => c.id === sourceId);
      if (from === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      const idx = Math.max(0, Math.min(targetIndex, next.length));
      next.splice(idx, 0, moved);
      const repositioned = next.map((c, i) => ({ ...c, position: i }));
      reorderBinder(
        binder.id,
        repositioned.map((c) => c.id)
      );
      return repositioned;
    });
  }

  function handleDropOnCard(targetId: string) {
    const sourceId = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const to = cards.findIndex((c) => c.id === targetId);
    if (to === -1) return;
    // drop the card into the target slot; the rest shift to make room.
    // splicing the source out first means inserting at `to` lands the card
    // after the target when dragging down, and before it when dragging up.
    moveCard(sourceId, to);
  }

  function handleDropOnEmpty(pageIndex: number) {
    const sourceId = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId) return;
    const pc = pages[pageIndex] ?? [];
    moveCard(sourceId, pageIndex * cardsPerPage + pc.length);
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
    clearHistory();
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    await bulkDeleteCards(ids);
    setCards((prev) => prev.filter((c) => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    setBulkBusy(false);
    setConfirmBulkDelete(false);
  }

  async function handleBulkMove(targetId: string) {
    clearHistory();
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
    snapshot();
    const newPages = [...pages];
    [newPages[swapFrom], newPages[pageIndex]] = [newPages[pageIndex], newPages[swapFrom]];
    const flat = newPages.flat();
    setCards(flat.map((c, i) => ({ ...c, position: i })));
    reorderPages(
      binder.id,
      newPages.map((p) => p.map((c) => c.id))
    );
    // the labels travel with their pages
    const a = String(swapFrom);
    const b = String(pageIndex);
    if (pageLabels[a] || pageLabels[b]) {
      const nextLabels = { ...pageLabels };
      const tmp = nextLabels[a];
      if (nextLabels[b]) nextLabels[a] = nextLabels[b];
      else delete nextLabels[a];
      if (tmp) nextLabels[b] = tmp;
      else delete nextLabels[b];
      setPageLabels(nextLabels);
      updatePageLabels(binder.id, nextLabels);
    }
    setSwapFrom(null);
  }

  function renderPage(pageIndex: number) {
    const pc = pages[pageIndex] ?? [];
    const empties = Math.max(0, cardsPerPage - pc.length);
    const label = pageLabels[String(pageIndex)];
    return (
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-center print:hidden">
          {editingLabelPage === pageIndex ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveLabel(pageIndex)}
                placeholder={`Rótulo da página ${pageIndex + 1}`}
                className="h-7 max-w-[200px] text-xs"
              />
              <button
                onClick={() => saveLabel(pageIndex)}
                aria-label="Salvar rótulo"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-deep text-white"
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setLabelDraft(label ?? "");
                setEditingLabelPage(pageIndex);
              }}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-ink-muted transition-colors hover:text-ink"
            >
              {label ? (
                <>
                  <Tag className="h-3 w-3 text-orange-deep" />
                  {label}
                </>
              ) : (
                <span className="flex items-center gap-0.5 opacity-60">
                  <Plus className="h-3 w-3" /> rótulo
                </span>
              )}
            </button>
          )}
        </div>

        <motion.div
          key={`${gridSize}-${pageIndex}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={`grid ${COLS_CLASS[cols]} gap-3 rounded-[2rem] border-2 border-ink/10 bg-surface p-4 sm:gap-4 sm:p-8 print:hidden`}
        >
          {pc.map((card) => (
            <div
              key={card.id}
              draggable={!selectMode}
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
              onDragLeave={() => setDragOverId((cur) => (cur === card.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnCard(card.id);
              }}
              onClick={() => selectMode && toggleCardSelected(card.id)}
              style={card.span_cols > 1 ? { gridColumn: `span ${card.span_cols}` } : undefined}
              className={`group relative aspect-[5/7] overflow-hidden rounded-lg border-2 bg-bg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                selectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
              } ${
                selectedIds.has(card.id) || dragOverId === card.id
                  ? "border-orange-deep ring-2 ring-orange-deep"
                  : "border-ink/10"
              } ${draggedId === card.id ? "opacity-30" : ""}`}
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
                  aria-label={
                    card.span_cols > 1 ? "Desfazer carta grande" : "Marcar como carta grande"
                  }
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

              {PRICES_ENABLED && showPrices && (
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
                      {Object.entries(VARIANT_LABEL).map(([key, lbl]) => (
                        <SelectItem key={key} value={key}>
                          {lbl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}

          {Array.from({ length: empties }).map((_, i) => {
            const slotKey = `p${pageIndex}-empty-${i}`;
            return (
              <button
                key={slotKey}
                onClick={() => setSearchOpen(true)}
                onDragOver={(e) => {
                  if (!draggedId) return;
                  e.preventDefault();
                  setDragOverId(slotKey);
                }}
                onDragLeave={() => setDragOverId((cur) => (cur === slotKey ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnEmpty(pageIndex);
                }}
                aria-label="Mover carta pra este espaço ou adicionar carta"
                className={`aspect-[5/7] rounded-lg border-2 border-dashed transition-colors hover:border-orange hover:bg-orange/5 ${
                  dragOverId === slotKey ? "border-orange-deep bg-orange/10" : "border-ink/10"
                }`}
              />
            );
          })}
        </motion.div>
      </div>
    );
  }

  const spread = viewMode === "spread" && totalPages > 1;

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
          {editingDesc ? (
            <div className="mt-1.5 flex items-start gap-1.5">
              <textarea
                autoFocus
                rows={2}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                placeholder="Pra que é esse fichário? (opcional)"
                className="w-full max-w-sm resize-none rounded-lg border-2 border-ink/15 bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-orange-deep"
              />
              <button
                onClick={handleSaveDesc}
                aria-label="Salvar descrição"
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-deep text-white"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : description ? (
            <button
              onClick={() => {
                setDescDraft(description);
                setEditingDesc(true);
              }}
              className="mt-1 max-w-md text-left text-sm text-ink-muted hover:text-ink"
            >
              {description}
              <Pencil className="ml-1.5 inline h-3 w-3 align-[-1px]" />
            </button>
          ) : (
            <button
              onClick={() => {
                setDescDraft("");
                setEditingDesc(true);
              }}
              className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar descrição
            </button>
          )}
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

            {PRICES_ENABLED && (
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
            )}

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

            <div className="flex items-center gap-1.5">
              <button
                onClick={undo}
                disabled={past.length === 0}
                aria-label="Desfazer"
                title="Desfazer (Ctrl+Z)"
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-surface-alt disabled:opacity-30"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={futureOrders.length === 0}
                aria-label="Refazer"
                title="Refazer (Ctrl+Shift+Z)"
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-surface-alt disabled:opacity-30"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            {totalPages > 1 && (
              <button
                onClick={() => setViewMode((v) => (v === "single" ? "spread" : "single"))}
                className={`hidden items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors lg:flex ${
                  spread
                    ? "border-orange bg-orange/10 text-orange-deep"
                    : "border-ink/10 text-ink-muted hover:text-ink"
                }`}
                title="Ver duas páginas lado a lado"
              >
                {spread ? <BookText className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                {spread ? "Livro" : "Página"}
              </button>
            )}

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(safePage - (spread ? 2 : 1))}
                  disabled={safePage === 0}
                  aria-label="Página anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-surface-alt disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-ink-muted">
                  {spread && safePage + 1 < totalPages
                    ? `Páginas ${safePage + 1}–${safePage + 2} de ${totalPages}`
                    : `Página ${safePage + 1} de ${totalPages}`}
                </span>
                <button
                  onClick={() => goToPage(safePage + (spread ? 2 : 1))}
                  disabled={safePage >= totalPages - 1}
                  aria-label="Próxima página"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-surface-alt disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {spread ? (
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:gap-6">
              {renderPage(safePage)}
              {safePage + 1 < totalPages ? (
                renderPage(safePage + 1)
              ) : (
                <div className="hidden flex-1 lg:block" />
              )}
            </div>
          ) : (
            <div className="mt-4">{renderPage(safePage)}</div>
          )}

          {/* print-only: every page, one per sheet */}
          <div className="hidden print:block">
            {pages.map((pc, pi) => (
              <div key={pi} className={pi < pages.length - 1 ? "break-after-page" : ""}>
                {pageLabels[String(pi)] && (
                  <p className="mb-2 font-display text-lg text-ink">{pageLabels[String(pi)]}</p>
                )}
                <div className={`grid ${COLS_CLASS[cols]} gap-2`}>
                  {pc.map((card) => (
                  <div
                    key={card.id}
                    style={card.span_cols > 1 ? { gridColumn: `span ${card.span_cols}` } : undefined}
                    className="aspect-[5/7] overflow-hidden rounded-lg border border-ink/20"
                  >
                      {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
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

      <AddCardsDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onConfirm={handleAddMany}
        showPageToggle={totalPages > 1}
        currentPage={safePage + 1}
        adding={adding}
      />

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
                <p className="mt-1.5 text-xs font-bold text-ink">
                  {pageLabels[String(pi)] ?? `Página ${pi + 1}`}
                </p>
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
