"use client";

import { useState } from "react";
import Link from "next/link";
import { BookPlus, Check, Loader2, X } from "lucide-react";
import { addToBinder } from "@/app/fichario/actions";

type CardData = {
  tcg_api_id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string;
};

export function AddToBinderButton({
  binders,
  card,
}: {
  binders: { id: string; name: string }[];
  card: CardData;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (binders.length === 0) {
    return (
      <Link
        href="/fichario"
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <BookPlus className="h-3.5 w-3.5" />
        Criar um fichário
      </Link>
    );
  }

  if (done) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-teal">
        <Check className="h-3.5 w-3.5" />
        No fichário {done}
      </p>
    );
  }

  async function add(binderId: string) {
    setBusy(true);
    try {
      await addToBinder(binderId, {
        tcg_api_id: card.tcg_api_id,
        name: card.name,
        set_name: card.set_name,
        card_number: card.card_number,
        image_url: card.image_url,
      });
      setDone(binders.find((b) => b.id === binderId)?.name ?? "");
    } catch {
      alert("Não deu pra adicionar. Tenta de novo.");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  if (binders.length === 1) {
    return (
      <button
        onClick={() => add(binders[0].id)}
        disabled={busy}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 px-3 py-1 text-xs font-bold text-ink hover:bg-surface-alt disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookPlus className="h-3.5 w-3.5" />}
        Adicionar ao fichário
      </button>
    );
  }

  return (
    <div className="mt-2">
      {open ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Em qual?</span>
          {binders.map((b) => (
            <button
              key={b.id}
              onClick={() => add(b.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink/15 px-2.5 py-1 text-xs font-bold text-ink hover:border-primary hover:bg-primary/10 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {b.name}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            aria-label="Cancelar"
            className="text-ink-muted hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 px-3 py-1 text-xs font-bold text-ink hover:bg-surface-alt"
        >
          <BookPlus className="h-3.5 w-3.5" />
          Adicionar ao fichário
        </button>
      )}
    </div>
  );
}
