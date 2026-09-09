"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Plus, BookOpen, Trash2, Sparkles, X } from "lucide-react";
import {
  loadGuestBinders,
  saveGuestBinders,
  newGuestBinder,
  GUEST_BINDER_LIMIT,
  type GuestBinder,
} from "@/lib/guest-binders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GuestBinderClient } from "./GuestBinderClient";

export function GuestFichario() {
  const [binders, setBinders] = useState<GuestBinder[]>([]);
  const [ready, setReady] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("Meu Fichário");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setBinders(loadGuestBinders());
      setReady(true);
    });
  }, []);

  function persist(next: GuestBinder[]) {
    setBinders(next);
    saveGuestBinders(next);
  }

  function handleCreate() {
    const b = newGuestBinder(newName);
    persist([b, ...binders]);
    setCreating(false);
    setNewName("Meu Fichário");
    setOpenId(b.id);
  }

  function updateBinder(updated: GuestBinder) {
    persist(binders.map((b) => (b.id === updated.id ? updated : b)));
  }

  function deleteBinder(id: string) {
    persist(binders.filter((b) => b.id !== id));
    setConfirmDeleteId(null);
  }

  if (!ready) return null;

  const open = binders.find((b) => b.id === openId);
  if (open) {
    return (
      <div className="mx-auto max-w-4xl">
        <GuestNotice />
        <GuestBinderClient
          binder={open}
          onChange={updateBinder}
          onBack={() => setOpenId(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <GuestNotice />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl text-ink text-comic-shadow-sm">
            <BookOpen className="h-6 w-6 text-primary" />
            MEUS FICHÁRIOS
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {binders.length}/{GUEST_BINDER_LIMIT} como convidado — crie uma conta pra ter mais e
            salvar de verdade.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={binders.length >= GUEST_BINDER_LIMIT}>
          <Plus className="h-4 w-4" />
          Novo fichário
        </Button>
      </div>

      {binders.length >= GUEST_BINDER_LIMIT && (
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border-2 border-orange/30 bg-orange/10 px-3 py-2 text-xs text-ink">
          <span className="font-semibold text-orange-deep">Chegou no limite de convidado.</span>
          <span className="text-ink-muted">Com conta você tem até 5 e eles ficam salvos de verdade.</span>
          <Link href="/cadastro?next=/fichario" className="font-bold text-primary hover:underline">
            Criar conta grátis →
          </Link>
        </div>
      )}

      {binders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-halftone py-16 text-center">
          <BookOpen className="h-10 w-10 text-ink-muted" />
          <p className="text-sm text-ink-muted">Sem fichário ainda. Bora montar o primeiro?</p>
          <Button onClick={() => setCreating(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Novo fichário
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {binders.map((b, i) => (
            <motion.button
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              onClick={() => setOpenId(b.id)}
              className="group relative overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface p-4 text-left transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 3 }).map((_, slot) => {
                  const img = b.cards[slot]?.image_url;
                  return img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external card art
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
                {b.cards.length} {b.cards.length === 1 ? "carta" : "cartas"}
              </p>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(b.id);
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border-2 border-ink/10 bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg tracking-wide text-ink">NOVO FICHÁRIO</h2>
              <button onClick={() => setCreating(false)} aria-label="Fechar">
                <X className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nome do fichário"
              className="mt-4"
            />
            <Button className="mt-3 w-full" onClick={handleCreate}>
              Criar
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(v) => !v && setConfirmDeleteId(null)}
        title="Apagar esse fichário?"
        description="Ele fica só nesse navegador — não dá pra recuperar depois."
        confirmLabel="Apagar"
        destructive
        onConfirm={() => confirmDeleteId && deleteBinder(confirmDeleteId)}
      />
    </div>
  );
}

function GuestNotice() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-2 border-orange/30 bg-orange/10 px-3 py-2 text-xs text-ink">
      <span className="flex items-center gap-1.5 font-semibold text-orange-deep">
        <Sparkles className="h-3.5 w-3.5" /> Modo convidado
      </span>
      <span className="text-ink-muted">
        Salvo só nesse navegador. Some se limpar os dados ou trocar de aparelho.
      </span>
      <Link href="/cadastro?next=/fichario" className="font-semibold text-primary hover:underline">
        Criar conta pra salvar →
      </Link>
    </div>
  );
}
