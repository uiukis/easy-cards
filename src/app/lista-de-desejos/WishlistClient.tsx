"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  Download,
  Pencil,
  ChevronDown,
} from "lucide-react";
import type { WishlistItem } from "@/lib/supabase/types";
import type { SearchResult } from "@/app/admin/cartas/CardSearch";
import { AddCardsDialog } from "@/app/fichario/AddCardsDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addWishlistItems,
  updateWishlistItem,
  removeWishlistItem,
  importWantedFromBinders,
  setWishlistPublic,
} from "./actions";

const PRIORITY: Record<number, { label: string; short: string; tone: string; ring: string }> = {
  1: { label: "Prioridade alta", short: "Alta", tone: "text-destructive", ring: "border-destructive/40" },
  2: { label: "Prioridade normal", short: "Normal", tone: "text-orange-deep", ring: "border-orange/40" },
  3: { label: "Sem pressa", short: "Baixa", tone: "text-ink-muted", ring: "border-ink/15" },
};

export function WishlistClient({
  initialItems,
  isPublic,
  shareSlug,
  wantedInBinders,
}: {
  initialItems: WishlistItem[];
  isPublic: boolean;
  shareSlug: string | null;
  wantedInBinders: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pub, setPub] = useState(isPublic);
  const [slug, setSlug] = useState(shareSlug);
  const [pubBusy, startPub] = useTransition();
  const [importing, startImport] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showAcquired, setShowAcquired] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = items.filter((i) => !i.acquired);
  const acquired = items.filter((i) => i.acquired);
  const shareUrl =
    slug && typeof window !== "undefined" ? `${window.location.origin}/u/${slug}` : "";

  const groups = useMemo(() => {
    return [1, 2, 3].map((p) => ({
      priority: p,
      items: active.filter((i) => i.priority === p),
    }));
  }, [active]);

  async function handleAdd(picked: SearchResult[]) {
    if (picked.length === 0) return;
    setAdding(true);
    try {
      await addWishlistItems(
        picked.map((c) => ({
          tcg_api_id: c.id,
          name: c.name,
          set_name: c.setName || null,
          card_number: c.cardNumber || null,
          image_url: c.imageUrl,
          rarity: c.rarity ?? null,
          types: c.types ?? null,
        }))
      );
      // simplest reliable path: reload so server order/dedupe is authoritative
      window.location.reload();
    } finally {
      setAdding(false);
    }
  }

  function handlePriority(id: string, priority: number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, priority } : i)));
    updateWishlistItem(id, { priority });
  }

  function handleAcquired(id: string, acquired: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, acquired } : i)));
    updateWishlistItem(id, { acquired });
  }

  function saveNote(id: string) {
    const value = noteDraft.trim();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, note: value || null } : i)));
    setEditingNote(null);
    updateWishlistItem(id, { note: value });
  }

  async function handleRemove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirmDelete(null);
    await removeWishlistItem(id);
  }

  function togglePublic(next: boolean) {
    setPub(next);
    startPub(async () => {
      const res = await setWishlistPublic(next);
      if (res?.slug) setSlug(res.slug);
    });
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function doImport() {
    startImport(async () => {
      await importWantedFromBinders();
      window.location.reload();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink text-comic-shadow-sm sm:text-4xl">
            <Sparkles className="h-6 w-6 text-primary" />
            LISTA DE DESEJO
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            As cartas que você tá caçando. A equipe da Easy Cards vê pra te avisar quando aparece —
            e você pode mandar sua lista pra galera também.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Adicionar carta
        </Button>
      </div>

      {/* share */}
      <div className="mt-5 rounded-2xl border-2 border-ink/10 bg-surface p-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Share2 className="h-4 w-4 text-primary" />
              Compartilhar minha lista
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Cria um link público com seu nome e os cards que você quer. Bom pra trocar e comprar
              na comunidade.
            </p>
          </div>
          <Switch checked={pub} onCheckedChange={togglePublic} disabled={pubBusy} />
        </label>

        {pub && shareUrl && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input readOnly value={shareUrl} className="h-9 flex-1 text-xs" />
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Link
              href={`/u/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink/15 px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-alt"
            >
              Ver <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {wantedInBinders > 0 && (
        <button
          onClick={doImport}
          disabled={importing}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange/40 bg-orange/5 px-3 py-2.5 text-xs font-bold text-orange-deep hover:bg-orange/10 disabled:opacity-60"
        >
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Puxar {wantedInBinders} carta(s) marcada(s) como “Quero” nos meus fichários
        </button>
      )}

      {/* list */}
      {active.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-[2rem] border-2 border-dashed border-ink/15 bg-surface/60 py-16 text-center">
          <Sparkles className="h-9 w-9 text-ink-muted" />
          <p className="max-w-xs text-sm text-ink-muted">
            Sua lista tá vazia. Adiciona as cartas que você quer — a gente fica de olho.
          </p>
          <Button onClick={() => setAddOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Adicionar carta
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.priority}>
                  <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${PRIORITY[g.priority].tone}`}>
                    {PRIORITY[g.priority].label} · {g.items.length}
                  </p>
                  <div className="space-y-2.5">
                    {g.items.map((item) => (
                      <WishlistRow
                        key={item.id}
                        item={item}
                        editingNote={editingNote === item.id}
                        noteDraft={noteDraft}
                        onNoteDraft={setNoteDraft}
                        onEditNote={() => {
                          setNoteDraft(item.note ?? "");
                          setEditingNote(item.id);
                        }}
                        onSaveNote={() => saveNote(item.id)}
                        onPriority={(p) => handlePriority(item.id, p)}
                        onAcquired={() => handleAcquired(item.id, true)}
                        onRemove={() => setConfirmDelete(item.id)}
                      />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}

      {acquired.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowAcquired((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted hover:text-ink"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showAcquired ? "rotate-180" : ""}`}
            />
            Já consegui · {acquired.length}
          </button>
          {showAcquired && (
            <div className="mt-2 space-y-2.5 opacity-70">
              {acquired.map((item) => (
                <WishlistRow
                  key={item.id}
                  item={item}
                  editingNote={false}
                  noteDraft=""
                  onNoteDraft={() => {}}
                  onEditNote={() => {}}
                  onSaveNote={() => {}}
                  onPriority={() => {}}
                  onAcquired={() => handleAcquired(item.id, false)}
                  onRemove={() => setConfirmDelete(item.id)}
                  acquiredView
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AddCardsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onConfirm={handleAdd}
        showPageToggle={false}
        currentPage={1}
        adding={adding}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title="Tirar da lista de desejo?"
        confirmLabel="Tirar"
        destructive
        onConfirm={() => confirmDelete && handleRemove(confirmDelete)}
      />
    </div>
  );
}

function WishlistRow({
  item,
  editingNote,
  noteDraft,
  onNoteDraft,
  onEditNote,
  onSaveNote,
  onPriority,
  onAcquired,
  onRemove,
  acquiredView = false,
}: {
  item: WishlistItem;
  editingNote: boolean;
  noteDraft: string;
  onNoteDraft: (v: string) => void;
  onEditNote: () => void;
  onSaveNote: () => void;
  onPriority: (p: number) => void;
  onAcquired: () => void;
  onRemove: () => void;
  acquiredView?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 rounded-2xl border-2 bg-surface p-3 ${PRIORITY[item.priority].ring}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
      <img
        src={item.image_url}
        alt={item.name}
        className="h-24 w-auto shrink-0 rounded-md object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {item.name}
          {item.card_number && (
            <span className="ml-1 font-normal text-ink-muted">({item.card_number})</span>
          )}
        </p>
        {item.set_name && <p className="truncate text-xs text-ink-muted">{item.set_name}</p>}

        {editingNote ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Input
              autoFocus
              value={noteDraft}
              onChange={(e) => onNoteDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSaveNote()}
              placeholder="Ex: qualquer versão NM, sem detalhe…"
              className="h-7 text-xs"
            />
            <button
              onClick={onSaveNote}
              aria-label="Salvar observação"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-deep text-white"
            >
              <Check className="h-3 w-3" />
            </button>
          </div>
        ) : item.note ? (
          <button
            onClick={onEditNote}
            disabled={acquiredView}
            className="mt-1 text-left text-xs text-ink-muted hover:text-ink"
          >
            “{item.note}”
            {!acquiredView && <Pencil className="ml-1 inline h-2.5 w-2.5 align-[-1px]" />}
          </button>
        ) : (
          !acquiredView && (
            <button
              onClick={onEditNote}
              className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted/70 hover:text-ink"
            >
              <Plus className="h-3 w-3" /> observação
            </button>
          )
        )}

        {!acquiredView && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Select value={String(item.priority)} onValueChange={(v) => v && onPriority(Number(v))}>
              <SelectTrigger className="h-7 w-auto gap-1 rounded-full border-2 border-ink/10 px-2.5 text-[11px] font-bold">
                <SelectValue>{(v: string) => PRIORITY[Number(v)]?.short ?? "Normal"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Alta</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="3">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={onAcquired}
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink/10 px-2.5 py-1 text-[11px] font-bold text-ink hover:border-teal hover:bg-teal/10 hover:text-teal"
            >
              <Check className="h-3 w-3" /> já consegui
            </button>
          </div>
        )}
      </div>

      <button
        onClick={acquiredView ? onAcquired : onRemove}
        aria-label={acquiredView ? "Voltar pra lista" : "Tirar da lista"}
        className="h-fit shrink-0 rounded-full p-1.5 text-ink-muted hover:bg-surface-alt hover:text-ink"
      >
        {acquiredView ? <Plus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </motion.div>
  );
}
