"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Plus, BookOpen, Trash2, Loader2 } from "lucide-react";
import type { Binder } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NewBinderDialog } from "./NewBinderDialog";
import { deleteBinder } from "./actions";

export type BinderWithPreview = Binder & {
  cardCount: number;
  previewImages: string[];
};

export function BinderListClient({ initial }: { initial: BinderWithPreview[] }) {
  const [binders, setBinders] = useState(initial);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteBinder(id);
    setBinders((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl text-ink text-comic-shadow-sm">
            <BookOpen className="h-6 w-6 text-primary" />
            MEUS FICHÁRIOS
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monte quantas vitrines de cartas quiser — por set, por Pokémon ou do seu jeito.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo fichário
        </Button>
      </div>

      {binders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-halftone py-20 text-center">
          <BookOpen className="h-10 w-10 text-ink-muted" />
          <p className="text-sm text-ink-muted">Você ainda não tem nenhum fichário. Bora criar o primeiro?</p>
          <Button onClick={() => setNewOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Novo fichário
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
                <p className="text-xs text-ink-muted">
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
