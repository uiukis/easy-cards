"use client";

import { motion } from "motion/react";
import { Brush, Sparkles } from "lucide-react";
import { HoloShine } from "@/components/HoloShine";

export type CardOfWeek = {
  name: string;
  set_name: string;
  card_number: string;
  image_large: string;
  artist: string | null;
  note: string;
};

export type CommunityStats = {
  binders: number;
  cardsInBinders: number;
  wishlistCards: number;
  auctions: number;
};

export function CardOfWeekSection({
  card,
  stats,
}: {
  card: CardOfWeek | null;
  stats: CommunityStats;
}) {
  if (!card && stats.binders === 0) return null;

  const numbers = [
    { value: stats.binders, label: "fichários montados" },
    { value: stats.cardsInBinders, label: "cartas organizadas" },
    { value: stats.wishlistCards, label: "cartas na lista de desejo" },
    { value: stats.auctions, label: "leilões realizados" },
  ].filter((n) => n.value > 0);

  return (
    <section className="relative py-20 sm:py-28">
      <div
        className={`mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:items-center ${
          card ? "lg:grid-cols-2" : "max-w-4xl"
        }`}
      >
        {card && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="flex gap-5 rounded-[2rem] border-2 border-ink/10 bg-surface p-5 sm:p-6"
          >
            <div className="relative w-32 shrink-0 self-start overflow-hidden rounded-xl sm:w-40">
              {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
              <img src={card.image_large} alt={card.name} className="w-full" />
              <HoloShine kind="special" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-deep/10 px-3 py-1 font-comic text-xs tracking-wide text-orange-deep">
                <Sparkles className="h-3.5 w-3.5" />
                Carta da semana
              </span>
              <h3 className="mt-2 font-display text-2xl leading-tight text-ink text-comic-shadow-sm">
                {card.name}
              </h3>
              <p className="text-xs text-ink-muted">
                {card.set_name} · {card.card_number}
              </p>
              {card.artist && (
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                  <Brush className="h-3 w-3 text-primary" />
                  {card.artist}
                </p>
              )}
              {card.note && <p className="mt-3 text-sm text-ink-muted">{card.note}</p>}
            </div>
          </motion.div>
        )}

        {numbers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <span className="font-comic text-sm tracking-wide text-teal">★ A galera tá usando</span>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {numbers.map((n) => (
                <div
                  key={n.label}
                  className="rounded-2xl border-2 border-ink/10 bg-surface p-4 text-center"
                >
                  <div className="font-display text-3xl text-orange-deep">
                    {n.value.toLocaleString("pt-BR")}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{n.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
