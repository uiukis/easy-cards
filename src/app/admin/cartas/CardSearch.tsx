"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export type SearchResult = {
  id: string;
  name: string;
  setName: string;
  imageUrl: string;
  cardNumber: string;
  rarity?: string | null;
  types?: string | null;
};

export function CardSearch({ onSelect }: { onSelect: (card: SearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      queueMicrotask(() => {
        setResults([]);
        setFailed(false);
      });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`/api/tcg-search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome da carta (ex: Charizard)"
          className="h-11 pl-9 pr-9 text-base"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" />
        )}
      </div>

      {failed && !loading && (
        <p className="mt-2 text-xs text-ink-muted">
          A busca falhou (base pública instável). Tenta de novo em alguns segundos.
        </p>
      )}

      {query.trim().length >= 3 && results.length === 0 && !loading && !failed && (
        <p className="mt-2 text-xs text-ink-muted">Nenhuma carta encontrada.</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg p-2 text-left transition-colors active:scale-[0.98] hover:bg-surface-alt"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external card art thumbnail */}
              <img src={c.imageUrl} alt={c.name} className="h-16 w-auto rounded-sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {c.name} <span className="font-normal text-ink-muted">({c.cardNumber})</span>
                </p>
                <p className="truncate text-xs text-ink-muted">{c.setName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
