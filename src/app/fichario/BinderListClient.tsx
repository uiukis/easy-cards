"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus, BookOpen, Trash2, Loader2, DownloadCloud } from "lucide-react";
import type { Binder } from "@/lib/supabase/types";
import { BINDER_LIMITS } from "@/lib/features";
import { loadGuestBinders, clearGuestBinders, type GuestBinder } from "@/lib/guest-binders";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NewBinderDialog } from "./NewBinderDialog";
import { deleteBinder, importGuestBinders } from "./actions";

export type BinderWithPreview = Binder & {
  cardCount: number;
  previewImages: string[];
};

export function BinderListClient({ initial }: { initial: BinderWithPreview[] }) {
  const router = useRouter();
  const [binders, setBinders] = useState(initial);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestBinder[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setGuests(loadGuestBinders()));
  }, []);

  async function handleImport() {
    setImporting(true);
    try {
      await importGuestBinders(
        guests.map((g) => ({
          name: g.name,
          description: g.description,
          grid_size: g.grid_size,
          page_labels: g.page_labels ?? {},
          cover_enabled: g.cover_enabled ?? false,
          cover_image_url: g.cover_image_url ?? null,
          cover_subtitle: g.cover_subtitle ?? null,
          page_backgrounds: g.page_backgrounds ?? {},
          cards: g.cards.map((c) => ({
            tcg_api_id: c.tcg_api_id,
            name: c.name,
            set_name: c.set_name,
            card_number: c.card_number,
            image_url: c.image_url,
            rarity: c.rarity,
            types: c.types,
            is_image: c.is_image ?? false,
            want: c.want ?? false,
          })),
        }))
      );
      clearGuestBinders();
      setGuests([]);
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  function dismissGuests() {
    clearGuestBinders();
    setGuests([]);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteBinder(id);
    setBinders((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  const atLimit = binders.length >= BINDER_LIMITS.user;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl text-ink text-comic-shadow-sm">
            <BookOpen className="h-6 w-6 text-primary" />
            MEUS FICHÁRIOS
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monte suas vitrines de cartas — por set, por Pokémon ou do seu jeito.
            {" "}
            <span className="whitespace-nowrap">
              ({binders.length}/{BINDER_LIMITS.user} no beta)
            </span>
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} disabled={atLimit}>
          <Plus className="h-4 w-4" />
          Novo fichário
        </Button>
      </div>

      {guests.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-orange/30 bg-orange/10 px-4 py-3 text-sm">
          <DownloadCloud className="h-4 w-4 shrink-0 text-orange-deep" />
          <span className="min-w-0 flex-1 text-ink">
            Você montou {guests.length} {guests.length === 1 ? "fichário" : "fichários"} como
            convidado. Quer trazer {guests.length === 1 ? "ele" : "eles"} pra sua conta?
          </span>
          <Button size="sm" onClick={handleImport} disabled={importing}>
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Importar
          </Button>
          <button
            onClick={dismissGuests}
            className="text-xs font-semibold text-ink-muted hover:text-ink"
          >
            descartar
          </button>
        </div>
      )}

      {atLimit && (
        <p className="mt-3 rounded-xl border-2 border-ink/10 bg-surface-alt px-3 py-2 text-xs text-ink-muted">
          Você chegou no limite de {BINDER_LIMITS.user} fichários durante o beta. Apague um pra criar
          outro — o limite deve subir depois.
        </p>
      )}

      {binders.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border-2 border-dashed border-border bg-halftone p-8 text-center sm:p-12">
          <BookOpen className="mx-auto h-10 w-10 text-ink-muted" />
          <h2 className="mt-3 font-display text-2xl text-ink">SEU PRIMEIRO FICHÁRIO</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
            Escolha um jeito de começar — dá pra montar do zero, puxar um set inteiro de uma vez ou
            juntar as cartas de um Pokémon só.
          </p>
          <div className="mx-auto mt-6 grid max-w-xl gap-2.5 text-left sm:grid-cols-3">
            {[
              { t: "Do zero", d: "Você adiciona as cartas." },
              { t: "Set completo", d: "Todas as cartas de um set." },
              { t: "Um Pokémon", d: "As cartas dele que você quiser." },
            ].map((o) => (
              <div key={o.t} className="rounded-2xl border-2 border-ink/10 bg-surface p-3">
                <p className="text-sm font-bold text-ink">{o.t}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{o.d}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => setNewOpen(true)} className="mt-6">
            <Plus className="h-4 w-4" />
            Começar
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {binders.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={`/fichario/${b.id}`} className="block p-4">
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 3 }).map((_, slot) => {
                    const img = b.previewImages[slot];
                    return img ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external card art URLs
                      <img
                        key={slot}
                        src={img}
                        alt=""
                        className="aspect-[5/7] w-full rounded-md object-cover"
                      />
                    ) : (
                      <div
                        key={slot}
                        className="aspect-[5/7] w-full rounded-md border-2 border-dashed border-ink/10"
                      />
                    );
                  })}
                </div>
                <p className="mt-3 truncate font-display text-lg tracking-wide text-ink">
                  {b.name.toUpperCase()}
                </p>
                {b.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{b.description}</p>
                )}
                <p className="mt-0.5 text-xs text-ink-muted">
                  {b.cardCount} {b.cardCount === 1 ? "carta" : "cartas"}
                </p>
              </Link>
              <button
                onClick={() => setConfirmDeleteId(b.id)}
                disabled={deletingId === b.id}
                aria-label={`Excluir ${b.name}`}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-100"
              >
                {deletingId === b.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <NewBinderDialog open={newOpen} onOpenChange={setNewOpen} />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(v) => !v && setConfirmDeleteId(null)}
        title="Excluir esse fichário?"
        description="Todas as cartas dele vão junto. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        loading={deletingId !== null}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
      />
    </div>
  );
}
