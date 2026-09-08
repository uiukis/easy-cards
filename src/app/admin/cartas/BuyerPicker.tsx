"use client";

import { useEffect, useState } from "react";
import { Search, X, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchBuyers, type BuyerResult } from "./buyerActions";

export function BuyerPicker({
  buyerId,
  buyerName,
  onChange,
}: {
  buyerId: string | null;
  buyerName: string;
  onChange: (buyer: { id: string | null; name: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BuyerResult[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      queueMicrotask(() => setResults([]));
      return;
    }
    const timer = setTimeout(async () => {
      setResults(await searchBuyers(query.trim()));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (buyerId) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 text-sm">
        <UserCheck className="h-4 w-4 shrink-0 text-teal" />
        <span className="flex-1 text-ink">{buyerName || "Usuário cadastrado"}</span>
        <button
          type="button"
          onClick={() => onChange({ id: null, name: "" })}
          className="text-ink-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={buyerName || query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ id: null, name: e.target.value });
          }}
          placeholder="Nome do comprador ou buscar cadastrado..."
          className="pl-9"
        />
      </div>
      {results.length > 0 && (
        <div className="mt-1.5 space-y-0.5 rounded-xl border border-border bg-bg p-1">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onChange({ id: r.id, name: r.full_name ?? r.phone ?? "" });
                setQuery("");
                setResults([]);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-alt"
            >
              <span className="text-ink">{r.full_name || "—"}</span>
              <span className="text-xs text-ink-muted">{r.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
