"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, Store, X } from "lucide-react";
import { SITE } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ShopCard = {
  id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string | null;
  condition: string | null;
  description: string | null;
  price: number | null;
};

function wantLink(card: ShopCard) {
  const text = `Oi! Tenho interesse na carta *${card.name}*${
    card.card_number ? ` (${card.card_number})` : ""
  }${card.set_name ? ` — ${card.set_name}` : ""} que vi na loja da Easy Cards.`;
  if (SITE.whatsappNumber) {
    return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
  return SITE.whatsappGroup;
}

export function LojaClient({ cards }: { cards: ShopCard[] }) {
  const [q, setQ] = useState("");
  const [set, setSet] = useState("all");

  const sets = useMemo(
    () => [...new Set(cards.map((c) => c.set_name).filter(Boolean))].sort() as string[],
    [cards]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (set !== "all" && c.set_name !== set) return false;
      if (term && !`${c.name} ${c.set_name ?? ""} ${c.card_number ?? ""}`.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [cards, q, set]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="bg-halftone -mx-5 -mt-10 rounded-b-[2rem] px-5 pb-6 pt-8 sm:-mx-8 sm:px-8">
        <p className="font-comic text-sm text-primary">
          <Store className="mr-1 inline h-4 w-4" /> Vitrine
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink text-comic-shadow-sm sm:text-4xl">
          CARTAS À VENDA
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Bateu o olho e quis? Clica em “quero essa” que a gente fala no WhatsApp.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="mt-8 rounded-2xl border-2 border-dashed border-ink/15 bg-surface/60 p-8 text-center text-sm text-ink-muted">
          Nenhuma carta na vitrine agora. Volta mais tarde ou dá um alô no grupo.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar carta…"
                className="h-10 pl-8"
              />
            </div>
            {sets.length > 1 && (
              <Select value={set} onValueChange={(v) => v && setSet(v)}>
                <SelectTrigger className="h-10">
                  <SelectValue>{(v: string) => (v === "all" ? "Todos os sets" : v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os sets</SelectItem>
                  {sets.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(q || set !== "all") && (
              <button
                onClick={() => {
                  setQ("");
                  setSet("all");
                }}
                className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> limpar
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className="flex flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface"
              >
                {card.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external card art
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="aspect-[5/7] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[5/7] w-full bg-surface-alt" />
                )}
                <div className="flex flex-1 flex-col p-2.5">
                  <p className="truncate text-xs font-semibold text-ink">
                    {card.name}
                    {card.card_number && (
                      <span className="ml-1 font-normal text-ink-muted">{card.card_number}</span>
                    )}
                  </p>
                  {card.set_name && (
                    <p className="truncate text-[11px] text-ink-muted">{card.set_name}</p>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    {card.condition && (
                      <span className="rounded bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                        {card.condition}
                      </span>
                    )}
                    <span className="text-xs font-bold text-primary">
                      {card.price != null ? `R$ ${Number(card.price).toFixed(2)}` : "Consultar"}
                    </span>
                  </div>
                  <a
                    href={wantLink(card)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    Quero essa
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-6 text-center text-sm text-ink-muted">Nada com esse filtro.</p>
          )}
        </>
      )}
    </div>
  );
}
