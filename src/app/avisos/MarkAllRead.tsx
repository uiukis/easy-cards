"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { markAllRead } from "./actions";

export function MarkAllRead() {
  const [busy, start] = useTransition();
  return (
    <button
      onClick={() => start(() => markAllRead())}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-alt disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      Marcar tudo como lido
    </button>
  );
}
