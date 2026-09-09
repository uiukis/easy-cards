"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          await createClient()
            .from("admin_activity")
            .update({ resolved_at: new Date().toISOString() })
            .eq("id", id);
          router.refresh();
        })
      }
      disabled={busy}
      aria-label="Marcar como resolvido"
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink/15 text-ink-muted hover:border-teal hover:text-teal disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
