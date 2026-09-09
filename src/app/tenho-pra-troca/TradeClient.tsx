"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Repeat2, Plus, Trash2, ArrowLeftRight, Sparkles, BadgeCheck } from "lucide-react";
import type { SearchResult } from "@/app/admin/cartas/CardSearch";
import { AddCardsDialog } from "@/app/fichario/AddCardsDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { addTradeItems, removeTradeItem } from "@/app/lista-de-desejos/actions";

export type TradeItem = {
  id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string;
  rarity: string | null;
  condition: string | null;
  note: string | null;
};

export type MatchRow = {
  name: string;
  card_number: string | null;
  image_url: string;
  who: string | null;
  username: string | null;
  verified: boolean;
};

function MatchList({
  title,
  hint,
  rows,
}: {
  title: string;
  hint: string;
  rows: MatchRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-2xl border-2 border-teal/40 bg-teal/5 p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-teal">
        <ArrowLeftRight className="h-4 w-4" />
        {title}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>
      <ul className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
            <img src={r.image_url} alt="" className="h-10 w-7 shrink-0 rounded-sm object-cover" />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-semibold text-ink">{r.name}</span>
              {r.card_number ? <span className="text-ink-muted"> {r.card_number}</span> : null}
            </span>
            {r.username ? (
              <Link
                href={`/u/${r.username}`}
                className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {(r.who ?? "ver").split(" ")[0]}
                {r.verified && <BadgeCheck className="h-3 w-3 text-teal" />}
              </Link>
            ) : (
              <span className="shrink-0 text-xs text-ink-muted">{(r.who ?? "").split(" ")[0]}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TradeClient({
  initial,
  matches,
  isPublic,
  shareSlug,
}: {
  initial: TradeItem[];
  matches: { theyHaveIWant: MatchRow[]; iHaveTheyWant: MatchRow[] };
  isPublic: boolean;
  shareSlug: string | null;
}) {
  const [items, setItems] = useState(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  async function handleAdd(picked: SearchResult[]) {
    if (picked.length === 0) return;
    setAdding(true);
    try {
      await addTradeItems(
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
      window.location.reload();
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setConfirmDel(null);
    await removeTradeItem(id);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl text-ink text-comic-shadow-sm sm:text-4xl">
            <Repeat2 className="h-6 w-6 text-teal" />
            TENHO PRA TROCA
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            As cartas repetidas que você topa trocar. Aparecem no seu perfil público e cruzam com a
            lista de desejo da galera.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Adicionar carta
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs">
        <Link href="/lista-de-desejos" className="font-semibold text-primary hover:underline">
          ← Lista de desejo
        </Link>
        {isPublic && shareSlug && (
          <Link href={`/u/${shareSlug}`} target="_blank" className="font-semibold text-primary hover:underline">
            Ver meu perfil público →
          </Link>
        )}
      </div>

      {(matches.theyHaveIWant.length > 0 || matches.iHaveTheyWant.length > 0) && (
        <div className="mt-6 space-y-3">
          <MatchList
            title="Alguém tem o que você quer"
            hint="Bate com a sua lista de desejo. Chama a pessoa."
            rows={matches.theyHaveIWant}
          />
          <MatchList
            title="Alguém quer o que você tem"
            hint="Tá na lista de desejo de outra pessoa."
            rows={matches.iHaveTheyWant}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-[2rem] border-2 border-dashed border-ink/15 bg-surface/60 py-16 text-center">
          <Sparkles className="h-9 w-9 text-ink-muted" />
          <p className="max-w-xs text-sm text-ink-muted">
            Nada aqui ainda. Adiciona as repetidas que você tá disposto a trocar.
          </p>
          <Button onClick={() => setAddOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Adicionar carta
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="group relative overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
              <img src={item.image_url} alt={item.name} className="aspect-[5/7] w-full object-cover" />
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold text-ink">{item.name}</p>
                {item.set_name && <p className="truncate text-[11px] text-ink-muted">{item.set_name}</p>}
              </div>
              <button
                onClick={() => setConfirmDel(item.id)}
                aria-label={`Tirar ${item.name}`}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
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
        open={confirmDel !== null}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Tirar da troca?"
        confirmLabel="Tirar"
        destructive
        onConfirm={() => confirmDel && remove(confirmDel)}
      />
    </div>
  );
}
