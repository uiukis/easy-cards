"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE, NEXT_EVENT } from "@/lib/site";
import { Sunburst } from "./Sunburst";
import { InstagramIcon } from "./icons";
import { randomCardImageUrls } from "@/lib/tcg-cards";

const BG_CARD_SLOTS = [
  { pos: "-bottom-6 -right-2", rotate: 4, w: "w-40 sm:w-52", z: 1 },
  { pos: "-bottom-12 -right-16", rotate: -8, w: "w-44 sm:w-60", z: 2 },
  { pos: "-bottom-10 -right-28", rotate: 14, w: "w-36 sm:w-48", z: 3 },
] as const;

export function EventsSection({
  date = NEXT_EVENT.date,
  place = NEXT_EVENT.place,
  tag = NEXT_EVENT.tag,
}: {
  date?: string;
  place?: string;
  tag?: string;
}) {
  const [bgCards, setBgCards] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setBgCards(randomCardImageUrls(BG_CARD_SLOTS.length)));
  }, []);

  return (
    <section id="eventos" className="relative overflow-hidden py-20 sm:py-28">
      <div className="bg-halftone pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-xl"
        >
          <span className="font-comic text-sm tracking-wide text-teal">
            ★ Primeiro evento presencial
          </span>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
            NUNCA JOGOU?
            <br />
            <span className="text-teal">A GENTE TE ENSINA.</span>
          </h2>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          {/* ticket-style event card, inspired by the story flyer format */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="clip-ticket relative overflow-hidden bg-orange p-8 text-blue-dark sm:p-12"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px]">
              <Sunburst />
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-30">
              {BG_CARD_SLOTS.map((slot, i) =>
                bgCards[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={slot.pos}
                    src={bgCards[i]}
                    alt=""
                    aria-hidden="true"
                    style={{ zIndex: slot.z, rotate: `${slot.rotate}deg` }}
                    className={`absolute ${slot.pos} ${slot.w} rounded-lg shadow-xl shadow-black/20`}
                  />
                ) : null
              )}
            </div>
            <div className="relative">
              <span className="inline-block -rotate-3 rounded-full border-2 border-blue-dark bg-yellow px-4 py-1 font-comic text-sm">
                Oficina Pokémon TCG
              </span>
              <h3 className="mt-5 font-comic text-4xl leading-[0.95] text-comic-shadow tracking-wide text-cream sm:text-5xl">
                APRENDA A
                <br />
                JOGAR DO ZERO
              </h3>
              <p className="mt-5 max-w-sm text-sm font-medium text-blue-dark/90">
                Regras, decks de treino e as primeiras partidas guiadas —
                sem pressão, no seu ritmo. {date}, no{" "}
                {place}.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/evento"
                  className="flex items-center justify-center gap-2 rounded-full bg-blue-dark px-6 py-3 text-sm font-bold text-cream transition-transform hover:scale-105 active:scale-95"
                >
                  Saiba mais sobre o evento
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-blue-dark/70">
                {tag} · vagas limitadas
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col justify-between gap-6 rounded-3xl border-2 border-ink/10 bg-surface p-8"
          >
            <div>
              <h4 className="font-display text-2xl tracking-wide text-ink">
                COMO FUNCIONA
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-ink-muted">
                <li className="flex gap-2">
                  <span className="font-display text-orange-deep">01</span>
                  Lista de inscritos com prioridade + mesa extra pra quem
                  chegar no dia.
                </li>
                <li className="flex gap-2">
                  <span className="font-display text-orange-deep">02</span>
                  Teoria e prática em rodadas, com decks de treino da Easy
                  Cards.
                </li>
                <li className="flex gap-2">
                  <span className="font-display text-orange-deep">03</span>
                  Educativo, sem competição — depois é só jogo livre e
                  sorteio.
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/evento"
                className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 px-6 py-3 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface-alt active:scale-95"
              >
                Ver a dinâmica completa
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                <InstagramIcon className="h-3.5 w-3.5" />
                Ver recap dos eventos passados
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
