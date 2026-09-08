"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type PriceResult = {
  found: boolean;
  exact?: boolean;
  price?: { priceMin: number; priceAvg: number; priceMax: number; url: string };
};

// Shared across every badge on the page so flipping back to an already
// -seen page (or two cards with the same name) doesn't refetch.
const cache = new Map<string, Promise<PriceResult>>();

function fetchPrice(name: string, number: string | null): Promise<PriceResult> {
  const key = `${name}|${number ?? ""}`;
  let pending = cache.get(key);
  if (!pending) {
    const params = new URLSearchParams({ name });
    if (number) params.set("number", number);
    pending = fetch(`/api/liga-price?${params}`)
      .then((r) => r.json())
      .catch(() => ({ found: false }) as PriceResult);
    cache.set(key, pending);
  }
  return pending;
}

export function PriceBadge({ name, cardNumber }: { name: string; cardNumber: string | null }) {
  const [result, setResult] = useState<PriceResult | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    fetchPrice(name, cardNumber).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [name, cardNumber]);

  if (result === "loading") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/70 backdrop-blur-sm">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      </span>
    );
  }

  if (!result.found || !result.price) return null;

  return (
    <a
      href={result.price.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Liga Pokémon: R$ ${result.price.priceMin.toFixed(2)} – R$ ${result.price.priceMax.toFixed(2)}${
        result.exact === false ? " (impressão aproximada)" : ""
      }`}
      className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/80"
    >
      R$ {result.price.priceAvg.toFixed(2)}
      {result.exact === false && "~"}
    </a>
  );
}
