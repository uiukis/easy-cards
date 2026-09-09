"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Pencil, Trash2, Loader2, HandCoins, ArrowLeft, ImageOff } from "lucide-react";
import type { Card, CardFinance } from "@/lib/supabase/types";
import { createCard, updateCard, deleteCard, type CardInput } from "./actions";
import { CardSearch, type SearchResult } from "./CardSearch";
import { FinanceModal } from "./FinanceModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminPageHeader } from "@/components/AdminPageHeader";

const STATUS_LABEL: Record<Card["status"], string> = {
  available: "Disponível",
  in_auction: "Em leilão",
  sold: "Vendida",
};

const CONDITION_OPTIONS = [
  { value: "M", label: "M — Mint" },
  { value: "NM", label: "NM — Near Mint" },
  { value: "SP", label: "SP — Slightly Played" },
  { value: "MP", label: "MP — Moderately Played" },
  { value: "HP", label: "HP — Heavily Played" },
  { value: "DMG", label: "DMG — Danificada" },
];

const STATUS_VARIANT: Record<Card["status"], "secondary" | "default" | "outline"> = {
  available: "secondary",
  in_auction: "default",
  sold: "outline",
};

export function CartasClient({
  initialCards,
  canViewFinance,
  financeByCardId,
}: {
  initialCards: Card[];
  canViewFinance: boolean;
  financeByCardId: Record<string, CardFinance>;
}) {
  const [cards, setCards] = useState(initialCards);
  const [editing, setEditing] = useState<Card | "new" | null>(null);
  const [financeFor, setFinanceFor] = useState<Card | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="CARTAS"
        subtitle="Catálogo pro leilão e vendas."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            Nova carta
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        className="mt-6"
      >
        {cards.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
            Nenhuma carta cadastrada ainda.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {cards.map((card) => {
              const fin = financeByCardId[card.id];
              return (
                <li
                  key={card.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-surface p-3 sm:flex-nowrap"
                >
                  {card.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="h-14 w-10 shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="h-14 w-10 shrink-0 rounded-sm bg-surface-alt" />
                  )}

                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-semibold text-ink">
                      {card.name}
                      {card.card_number && (
                        <span className="ml-1 font-normal text-ink-muted">({card.card_number})</span>
                      )}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                      {card.set_name && <span className="truncate">{card.set_name}</span>}
                      {card.condition && (
                        <span className="rounded bg-surface-alt px-1.5 py-0.5 font-semibold">
                          {card.condition}
                        </span>
                      )}
                      {canViewFinance && fin?.final_price != null && (
                        <span className="font-semibold text-primary">
                          R$ {Number(fin.final_price).toFixed(2)}
                        </span>
                      )}
                      {canViewFinance && fin?.delivery_method === "dominaria" && (
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${
                            fin.dominaria_deposited_at
                              ? "bg-teal/15 text-teal"
                              : "bg-orange/15 text-orange-deep"
                          }`}
                        >
                          {fin.dominaria_deposited_at
                            ? `Domi ✓ ${new Date(
                                fin.dominaria_deposited_at + "T00:00:00"
                              ).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
                            : "Domi — a depositar"}
                        </span>
                      )}
                    </p>
                  </div>

                  <Badge
                    variant={STATUS_VARIANT[card.status]}
                    className="order-last shrink-0 sm:order-none"
                  >
                    {STATUS_LABEL[card.status]}
                  </Badge>

                  <div className="ml-auto flex shrink-0 items-center gap-0.5">
                    {canViewFinance && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setFinanceFor(card)}
                        title="Financeiro"
                      >
                        <HandCoins className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(card)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setConfirmDeleteId(card.id)}
                      disabled={deletingId === card.id}
                    >
                      {deletingId === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>

      <CardModal
        card={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={(card) => {
          setCards((prev) =>
            editing === "new" ? [card, ...prev] : prev.map((c) => (c.id === card.id ? card : c))
          );
          setEditing(null);
        }}
      />

      {financeFor && (
        <FinanceModal
          card={financeFor}
          finance={financeByCardId[financeFor.id] ?? null}
          onClose={() => setFinanceFor(null)}
          onSaved={() => window.location.reload()}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(v) => !v && setConfirmDeleteId(null)}
        title="Remover essa carta?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        destructive
        loading={deletingId !== null}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
      />
    </div>
  );
}

type Step = "search" | "details";

function CardModal({
  card,
  open,
  onClose,
  onSaved,
}: {
  card: Card | null;
  open: boolean;
  onClose: () => void;
  onSaved: (card: Card) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CardInput>(() => toFormState(card));
  const [step, setStep] = useState<Step>(card ? "details" : "search");
  const [showImageUrl, setShowImageUrl] = useState(!card?.image_url);

  // Re-seed the form whenever a different card (or "new") opens.
  const [openCardId, setOpenCardId] = useState(card?.id ?? "new");
  if ((card?.id ?? "new") !== openCardId) {
    setOpenCardId(card?.id ?? "new");
    setForm(toFormState(card));
    setStep(card ? "details" : "search");
    setShowImageUrl(!card?.image_url);
  }

  function handleSelect(result: SearchResult) {
    setForm((f) => ({
      ...f,
      name: result.name,
      set_name: result.setName,
      card_number: result.cardNumber,
      image_url: result.imageUrl,
      tcg_api_id: result.id,
    }));
    setShowImageUrl(false);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url) {
      setError("Toda carta precisa de uma imagem.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (card) {
        await updateCard(card.id, form);
        onSaved({
          ...card,
          name: form.name,
          set_name: form.set_name || null,
          card_number: form.card_number || null,
          image_url: form.image_url || null,
          condition: form.condition || null,
          description: form.description || null,
          status: form.status,
        });
      } else {
        await createCard(form);
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra salvar.");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">
            {card ? "EDITAR CARTA" : step === "search" ? "BUSCAR CARTA" : "DETALHES DA CARTA"}
          </DialogTitle>
        </DialogHeader>

        {step === "search" ? (
          <div className="space-y-3">
            <CardSearch onSelect={handleSelect} />
            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-center text-xs font-semibold text-ink-muted underline w-full"
            >
              Não achei a carta, preencher na mão
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {!card && (
              <button
                type="button"
                onClick={() => setStep("search")}
                className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar pra busca
              </button>
            )}

            <div className="flex flex-col items-center gap-2">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external card art preview
                <img
                  src={form.image_url}
                  alt={form.name || "Preview da carta"}
                  className="h-40 w-auto rounded-lg object-contain shadow-md"
                />
              ) : (
                <div className="flex h-40 w-28 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-ink-muted">
                  <ImageOff className="h-6 w-6" />
                  <span className="text-[11px]">Sem imagem</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowImageUrl((v) => !v)}
                className="text-xs font-semibold text-ink-muted underline"
              >
                {showImageUrl ? "esconder link da imagem" : "editar link da imagem"}
              </button>
            </div>

            {showImageUrl && (
              <div className="space-y-1.5">
                <Label>URL da imagem *</Label>
                <Input
                  required
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Nome da carta *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Coleção (opcional)</Label>
                <Input
                  value={form.set_name}
                  onChange={(e) => setForm((f) => ({ ...f, set_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Número (ex: 20/189)</Label>
                <Input
                  value={form.card_number}
                  onChange={(e) => setForm((f) => ({ ...f, card_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Condição</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, condition: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => v || "Selecionar"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as Card["status"] }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: Card["status"]) => STATUS_LABEL[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="in_auction">Em leilão</SelectItem>
                    <SelectItem value="sold">Vendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function toFormState(card: Card | null): CardInput {
  return {
    name: card?.name ?? "",
    set_name: card?.set_name ?? "",
    card_number: card?.card_number ?? "",
    image_url: card?.image_url ?? "",
    condition: card?.condition ?? "",
    description: card?.description ?? "",
    status: card?.status ?? "available",
    tcg_api_id: card?.tcg_api_id ?? "",
  };
}
