"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  HandCoins,
  ArrowLeft,
  ImageOff,
  Search,
  Download,
  X,
  Store,
  Heart,
  ExternalLink,
  Layers,
} from "lucide-react";
import type { Card, CardFinance } from "@/lib/supabase/types";
import { toCsv, downloadCsv } from "@/lib/csv";
import { maskBRL, brlFromNumber, brlToPlain } from "@/lib/money";
import { PAY_LABEL, isOverdue, owed as owedOf } from "@/lib/finance";
import {
  createCard,
  updateCard,
  deleteCard,
  setShopEnabled,
  createManyCards,
  type CardInput,
} from "./actions";
import { CardSearch, type SearchResult } from "./CardSearch";
import { AddCardsDialog } from "@/app/fichario/AddCardsDialog";
import { FinanceModal } from "./FinanceModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

function shortDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function historyLine(card: Card, people: Record<string, string>): string {
  const creator = card.created_by ? people[card.created_by] : null;
  let line = creator
    ? `cadastrada por ${creator.split(" ")[0]} · ${shortDate(card.created_at)}`
    : `cadastrada em ${shortDate(card.created_at)}`;
  const editedLater =
    card.updated_at &&
    new Date(card.updated_at).getTime() - new Date(card.created_at).getTime() > 60_000;
  if (editedLater && card.updated_by) {
    const editor = people[card.updated_by];
    line += ` · editada por ${editor ? editor.split(" ")[0] : "?"} · ${shortDate(card.updated_at)}`;
  }
  return line;
}

const STATUS_VARIANT: Record<Card["status"], "secondary" | "default" | "outline"> = {
  available: "secondary",
  in_auction: "default",
  sold: "outline",
};

export type WishMatch = {
  name: string;
  phone: string | null;
  note: string | null;
  priority: number;
};

export function CartasClient({
  initialCards,
  canViewFinance,
  financeByCardId,
  openFinanceCardId = null,
  shopEnabled = false,
  wishlistMatches = {},
  peopleById = {},
}: {
  initialCards: Card[];
  canViewFinance: boolean;
  financeByCardId: Record<string, CardFinance>;
  openFinanceCardId?: string | null;
  shopEnabled?: boolean;
  wishlistMatches?: Record<string, WishMatch[]>;
  peopleById?: Record<string, string>;
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [editing, setEditing] = useState<Card | "new" | null>(null);
  const [financeFor, setFinanceFor] = useState<Card | null>(null);
  const [shopOn, setShopOn] = useState(shopEnabled);
  const [shopBusy, startShop] = useTransition();
  const [wishFor, setWishFor] = useState<{ card: Card; matches: WishMatch[] } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function handleBulk(picked: SearchResult[]) {
    if (picked.length === 0) return;
    setBulkBusy(true);
    try {
      await createManyCards(
        picked.map((c) => ({
          tcg_api_id: c.id,
          name: c.name,
          set_name: c.setName || "",
          card_number: c.cardNumber || "",
          image_url: c.imageUrl,
        }))
      );
      window.location.reload();
    } finally {
      setBulkBusy(false);
    }
  }

  // Deep link from /admin/financeiro — open a card's finance modal straight away.
  useEffect(() => {
    if (!openFinanceCardId) return;
    const card = initialCards.find((c) => c.id === openFinanceCardId);
    if (card) queueMicrotask(() => setFinanceFor(card));
    router.replace("/admin/cartas");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFinanceCardId]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [payF, setPayF] = useState("all");
  const [buyerF, setBuyerF] = useState("all");
  const [auctionF, setAuctionF] = useState("all");

  const buyerOptions = useMemo(
    () =>
      [
        ...new Set(
          Object.values(financeByCardId)
            .map((f) => f.buyer_name)
            .filter(Boolean) as string[]
        ),
      ].sort(),
    [financeByCardId]
  );
  const auctionOptions = useMemo(
    () =>
      [
        ...new Set(
          Object.values(financeByCardId)
            .map((f) => f.auction_label)
            .filter(Boolean) as string[]
        ),
      ].sort(),
    [financeByCardId]
  );

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (term && !`${c.name} ${c.set_name ?? ""} ${c.card_number ?? ""}`.toLowerCase().includes(term))
        return false;
      if (statusF !== "all" && c.status !== statusF) return false;
      const fin = financeByCardId[c.id];
      if (payF !== "all") {
        const st = fin?.payment_status ?? "aberto";
        if (payF === "paid" && st !== "pago") return false;
        if (payF === "parcial" && st !== "parcial") return false;
        if (payF === "unpaid" && (st === "pago" || c.status !== "sold")) return false;
        if (payF === "vencido" && !isOverdue({ due_date: fin?.due_date ?? null, payment_status: st }))
          return false;
        if (payF === "domi_pending" && !(fin?.delivery_method === "dominaria" && !fin.dominaria_deposited_at))
          return false;
      }
      if (buyerF !== "all" && fin?.buyer_name !== buyerF) return false;
      if (auctionF !== "all" && fin?.auction_label !== auctionF) return false;
      return true;
    });
  }, [cards, q, statusF, payF, buyerF, auctionF, financeByCardId]);

  const activeFilters =
    (statusF !== "all" ? 1 : 0) +
    (payF !== "all" ? 1 : 0) +
    (buyerF !== "all" ? 1 : 0) +
    (auctionF !== "all" ? 1 : 0) +
    (q.trim() ? 1 : 0);

  function handleExport() {
    const header = [
      "Carta",
      "Número",
      "Set",
      "Condição",
      "Status",
      "Preço",
      "Comprador",
      "Entrega",
      "Taxa Dominaria",
      "Depositado na Domi",
      "Pagamento",
      "Já pagou",
      "Falta",
      "Prazo",
      "Pago em",
      "Vendido em",
      "Leilão",
      "Observações",
    ];
    const rows = filtered.map((c) => {
      const f = financeByCardId[c.id];
      const money = (n: number | null | undefined) =>
        n == null ? "" : Number(n).toFixed(2).replace(".", ",");
      const date = (d: string | null | undefined) =>
        d ? new Date(d).toLocaleDateString("pt-BR") : "";
      return [
        c.name,
        c.card_number ?? "",
        c.set_name ?? "",
        c.condition ?? "",
        STATUS_LABEL[c.status],
        money(f?.final_price),
        f?.buyer_name ?? "",
        f?.delivery_method === "dominaria" ? "Dominaria" : f?.delivery_method === "maos" ? "Em mãos" : "",
        money(f?.dominaria_fee),
        date(f?.dominaria_deposited_at),
        f ? PAY_LABEL[f.payment_status] ?? f.payment_status : c.status === "sold" ? "Aberto" : "",
        money(f?.amount_paid),
        f
          ? money(
              owedOf({
                final_price: f.final_price,
                amount_paid: f.amount_paid,
                payment_status: f.payment_status,
              })
            )
          : "",
        date(f?.due_date),
        date(f?.paid_at),
        date(f?.sold_at),
        f?.auction_label ?? "",
        (f?.notes ?? "").replace(/\r?\n/g, " "),
      ];
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`easycards-cartas-${stamp}.csv`, toCsv([header, ...rows]));
  }

  return (
    <div>
      <AdminPageHeader
        title="CARTAS"
        subtitle="Catálogo pro leilão e vendas."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Layers className="h-4 w-4" />
              Em lote
            </Button>
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" />
              Nova carta
            </Button>
          </div>
        }
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink/10 bg-surface p-3">
        <label className="flex items-center gap-3">
          <Switch
            checked={shopOn}
            disabled={shopBusy}
            onCheckedChange={(v) => {
              setShopOn(v);
              startShop(() => setShopEnabled(v));
            }}
          />
          <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <Store className="h-4 w-4 text-primary" />
            Vitrine pública {shopOn ? "ligada" : "desligada"}
          </span>
        </label>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="hidden sm:inline">
            Mostra em <span className="font-semibold">/loja</span> as cartas marcadas “à venda”.
          </span>
          <Link
            href="/loja"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-full border-2 border-ink/15 px-2.5 py-1 font-bold text-ink hover:bg-surface-alt"
          >
            Ver <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {cards.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar carta…"
              className="h-9 pl-8 text-sm"
            />
          </div>
          <Select value={statusF} onValueChange={(v) => v && setStatusF(v)}>
            <SelectTrigger className="h-9">
              <SelectValue>
                {(v: string) => (v === "all" ? "Status" : STATUS_LABEL[v as Card["status"]])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="in_auction">Em leilão</SelectItem>
              <SelectItem value="sold">Vendida</SelectItem>
            </SelectContent>
          </Select>
          {canViewFinance && (
            <Select value={payF} onValueChange={(v) => v && setPayF(v)}>
              <SelectTrigger className="h-9">
                <SelectValue>
                  {(v: string) =>
                    ({
                      all: "Pagamento",
                      paid: "Pago",
                      parcial: "Parcial",
                      unpaid: "A receber",
                      vencido: "Vencido",
                      domi_pending: "Domi a depositar",
                    }[v] ?? "Pagamento")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer pagamento</SelectItem>
                <SelectItem value="unpaid">A receber</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="domi_pending">Domi a depositar</SelectItem>
              </SelectContent>
            </Select>
          )}
          {canViewFinance && buyerOptions.length > 0 && (
            <Select value={buyerF} onValueChange={(v) => v && setBuyerF(v)}>
              <SelectTrigger className="h-9">
                <SelectValue>{(v: string) => (v === "all" ? "Comprador" : v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer comprador</SelectItem>
                {buyerOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canViewFinance && auctionOptions.length > 0 && (
            <Select value={auctionF} onValueChange={(v) => v && setAuctionF(v)}>
              <SelectTrigger className="h-9">
                <SelectValue>{(v: string) => (v === "all" ? "Leilão" : v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer leilão</SelectItem>
                {auctionOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setQ("");
                setStatusF("all");
                setPayF("all");
                setBuyerF("all");
                setAuctionF("all");
              }}
              className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" /> limpar
            </button>
          )}
          {canViewFinance && (
            <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        className="mt-4"
      >
        {cards.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
            Nenhuma carta cadastrada ainda.
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
            Nenhuma carta com esses filtros.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((card) => {
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
                      {canViewFinance && card.status === "sold" && (() => {
                        const st = fin?.payment_status ?? "aberto";
                        const over = isOverdue({ due_date: fin?.due_date ?? null, payment_status: st });
                        return (
                          <span
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              st === "pago"
                                ? "bg-teal/15 text-teal"
                                : over
                                  ? "bg-destructive/15 text-destructive"
                                  : st === "parcial"
                                    ? "bg-orange/15 text-orange-deep"
                                    : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {st === "pago"
                              ? "Pago"
                              : over
                                ? "Vencido"
                                : st === "parcial"
                                  ? "Parcial"
                                  : "A receber"}
                          </span>
                        );
                      })()}
                      {canViewFinance && fin?.auction_label && (
                        <span className="rounded bg-surface-alt px-1.5 py-0.5 font-semibold text-ink-muted">
                          {fin.auction_label}
                        </span>
                      )}
                      {card.in_stock && (
                        <span className="flex items-center gap-0.5 rounded bg-teal/15 px-1.5 py-0.5 font-semibold text-teal">
                          <Store className="h-3 w-3" /> à venda
                          {card.price != null && ` · R$ ${Number(card.price).toFixed(2)}`}
                        </span>
                      )}
                      {wishlistMatches[card.id]?.length > 0 && (
                        <button
                          onClick={() =>
                            setWishFor({ card, matches: wishlistMatches[card.id] })
                          }
                          className="flex items-center gap-0.5 rounded bg-orange/15 px-1.5 py-0.5 font-semibold text-orange-deep hover:bg-orange/25"
                        >
                          <Heart className="h-3 w-3" /> {wishlistMatches[card.id].length}{" "}
                          {wishlistMatches[card.id].length === 1 ? "quer" : "querem"}
                        </button>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted/70">
                      {historyLine(card, peopleById)}
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

      <AddCardsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onConfirm={handleBulk}
        showPageToggle={false}
        currentPage={1}
        adding={bulkBusy}
      />

      <Dialog open={wishFor !== null} onOpenChange={(v) => !v && setWishFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display tracking-wide">
              <Heart className="h-4 w-4 text-orange-deep" />
              QUEREM {wishFor?.card.name.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-ink-muted">
            Gente com essa carta na lista de desejo. Manda um alô que ela chegou.
          </p>
          <ul className="space-y-1.5">
            {wishFor?.matches.map((m, i) => {
              const digits = (m.phone ?? "").replace(/\D/g, "");
              const wa = digits.length >= 10 ? `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}` : null;
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-xl border-2 border-ink/10 p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{m.name}</p>
                    {m.note && <p className="truncate text-xs text-ink-muted">“{m.note}”</p>}
                  </div>
                  {wa ? (
                    <a
                      href={
                        wa +
                        `?text=${encodeURIComponent(
                          `Oi! Apareceu a carta ${wishFor?.card.name}${
                            wishFor?.card.card_number ? ` (${wishFor.card.card_number})` : ""
                          } que tá na sua lista de desejo na Easy Cards 👀`
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full bg-teal px-3 py-1 text-xs font-bold text-white"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-ink-muted">sem telefone</span>
                  )}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
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

    const payload: CardInput = { ...form, price: brlToPlain(form.price) };

    try {
      if (card) {
        await updateCard(card.id, payload);
        onSaved({
          ...card,
          name: form.name,
          set_name: form.set_name || null,
          card_number: form.card_number || null,
          image_url: form.image_url || null,
          condition: form.condition || null,
          description: form.description || null,
          status: form.status,
          in_stock: form.in_stock,
          price: payload.price ? Number(payload.price) : null,
          updated_at: new Date().toISOString(),
        });
      } else {
        await createCard(payload);
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

            <div className="rounded-xl border-2 border-ink/10 p-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Switch
                  checked={form.in_stock}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, in_stock: v }))}
                />
                Mostrar na vitrine (à venda)
              </label>
              {form.in_stock && (
                <div className="mt-3 space-y-1.5">
                  <Label>Preço na vitrine (opcional — vazio = “consultar”)</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: maskBRL(e.target.value) }))}
                  />
                </div>
              )}
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
    in_stock: card?.in_stock ?? false,
    price: card?.price != null ? brlFromNumber(Number(card.price)) : "",
  };
}
