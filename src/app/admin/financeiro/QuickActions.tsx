"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { markCardPaid, markDominariaDeposited } from "./actions";

type Kind = "paid" | "deposited";

const LABEL: Record<Kind, string> = {
  paid: "marcar pago",
  deposited: "marcar depositado",
};

export function MarkButton({ kind, cardId }: { kind: Kind; cardId: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal">
        <Check className="h-3.5 w-3.5" /> ok
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (kind === "paid") await markCardPaid(cardId);
          else await markDominariaDeposited(cardId);
          setDone(true);
        })
      }
      className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink/15 px-2.5 py-1 text-xs font-bold text-ink transition-colors hover:border-teal hover:bg-teal/10 hover:text-teal disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      {LABEL[kind]}
    </button>
  );
}
