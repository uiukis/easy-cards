"use client";

import { useState } from "react";
import { Check, Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PurchaseConfirm({
  financeId,
  confirmedAt,
  disputedAt,
}: {
  financeId: string;
  confirmedAt: string | null;
  disputedAt: string | null;
}) {
  const [state, setState] = useState<"confirmed" | "disputed" | null>(
    confirmedAt ? "confirmed" : disputedAt ? "disputed" : null
  );
  const [busy, setBusy] = useState(false);

  async function set(disputed: boolean) {
    setBusy(true);
    try {
      await createClient().rpc("confirm_purchase", {
        p_finance_id: financeId,
        p_disputed: disputed,
      });
      setState(disputed ? "disputed" : "confirmed");
    } catch {
      alert("Não deu pra registrar. Tenta de novo.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "confirmed") {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-teal">
        <Check className="h-3.5 w-3.5" /> Você confirmou essa compra
      </p>
    );
  }

  if (state === "disputed") {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
        <ShieldAlert className="h-3.5 w-3.5" /> Você marcou que não foi você — a equipe foi avisada
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-xl border-2 border-orange/30 bg-orange/10 p-2.5">
      <p className="text-xs font-semibold text-ink">A Easy Cards marcou essa compra no seu nome. Foi você?</p>
      <div className="mt-1.5 flex gap-2">
        <button
          onClick={() => set(false)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full bg-teal px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Sim, fui eu
        </button>
        <button
          onClick={() => set(true)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full border-2 border-ink/15 px-3 py-1 text-xs font-bold text-ink hover:border-destructive hover:text-destructive disabled:opacity-60"
        >
          Não fui eu
        </button>
      </div>
    </div>
  );
}
