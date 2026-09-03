"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { WalletCards, GraduationCap, Gavel } from "lucide-react";
import { SITE } from "@/lib/site";
import { FloatingCard } from "./FloatingCard";
import { Sunburst } from "./Sunburst";
import { WhatsAppIcon, InstagramIcon } from "./icons";
import { randomCardImageUrls } from "@/lib/tcg-cards";

const TITLE = "EASY CARDS";

const BADGES = [
  { Icon: WalletCards, label: "Cards originais" },
  { Icon: GraduationCap, label: "Eventos e oficinas" },
  { Icon: Gavel, label: "Leilões toda semana" },
  { Icon: WhatsAppIcon, label: "Direto no WhatsApp" },
];

const CARD_SLOTS = [
  { pos: "left-[5%] top-[10%]", variant: "blue", rotate: -12, delay: 0.15, size: 92 },
  { pos: "left-[1%] top-[38%]", variant: "orange", rotate: 9, delay: 0.55, size: 100 },
  { pos: "left-[9%] top-[64%]", variant: "teal", rotate: -7, delay: 0.9, size: 96 },
  { pos: "left-[12%] bottom-[4%]", variant: "blue", rotate: 13, delay: 1.25, size: 108 },
  { pos: "right-[6%] top-[8%]", variant: "orange", rotate: 10, delay: 0.3, size: 96 },
  { pos: "right-[2%] top-[36%]", variant: "teal", rotate: -11, delay: 0.7, size: 100 },
  { pos: "right-[10%] top-[62%]", variant: "blue", rotate: 8, delay: 1.05, size: 92 },
  { pos: "right-[14%] bottom-[2%]", variant: "orange", rotate: -6, delay: 1.4, size: 112 },
] as const;

const BG_CARD_SLOTS = [
  { pos: "left-[11%] top-[0%]", rotate: 10, w: "w-40 sm:w-52", z: 1, delay: 0 },
  { pos: "right-[12%] top-[0%]", rotate: -8, w: "w-40 sm:w-52", z: 2, delay: 0.12 },
  { pos: "left-[6%] top-[21%]", rotate: 4, w: "w-36 sm:w-48", z: 3, delay: 0.24 },
  { pos: "right-[6%] top-[23%]", rotate: -5, w: "w-36 sm:w-48", z: 4, delay: 0.36 },
  { pos: "left-[1%] top-[5%]", rotate: -14, w: "w-44 sm:w-56", z: 5, delay: 0.48 },
  { pos: "right-[1%] top-[8%]", rotate: 12, w: "w-44 sm:w-56", z: 6, delay: 0.6 },
] as const;

export function Hero() {
  const [cardImages, setCardImages] = useState<string[]>([]);
  const [bgCards, setBgCards] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setCardImages(randomCardImageUrls(CARD_SLOTS.length));
      setBgCards(randomCardImageUrls(BG_CARD_SLOTS.length));
    });
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pt-16 pb-16 sm:pt-20">
      {/* full-bleed animated comic background: rays behind everything, dots on top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.8, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2"
      >
        <Sunburst />
      </motion.div>
      <div className="bg-halftone pointer-events-none absolute inset-0 opacity-60" />

      {/* faded, stacked card art peeking through behind the headline.
          The group itself is faded as one flattened layer (opacity here
          creates a stacking context), so the cards stay fully opaque
          against each other and occlude properly instead of blending. */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {BG_CARD_SLOTS.map((slot, i) =>
          bgCards[i] ? (
            <motion.img
              key={slot.pos}
              src={bgCards[i]}
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.85, rotate: slot.rotate - 6, y: 16 }}
              animate={{ opacity: 1, scale: 1, rotate: slot.rotate, y: 0 }}
              transition={{ duration: 0.9, delay: slot.delay, ease: [0.16, 1, 0.3, 1] }}
              style={{ zIndex: slot.z }}
              className={`absolute ${slot.pos} ${slot.w} rounded-lg shadow-xl shadow-black/20`}
            />
          ) : null
        )}
      </div>

      {/* floating decorative cards, hidden on small screens to keep things tidy */}
      <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
        {CARD_SLOTS.map((slot, i) => (
          <div key={slot.pos} className={`pointer-events-auto absolute ${slot.pos}`}>
            <FloatingCard
              variant={slot.variant}
              rotate={slot.rotate}
              delay={slot.delay}
              size={slot.size}
              imageUrl={cardImages[i]}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -4 }}
          transition={{ duration: 0.5 }}
          className="mb-2 inline-block rounded-full border-2 border-blue-dark bg-yellow px-4 py-1.5 font-comic text-sm tracking-wide text-blue-dark shadow-[3px_3px_0_var(--blue-dark)]"
        >
          A comunidade dos apaixonados por Pokémon TCG
        </motion.div>

        <h1 className="mt-4 flex font-display text-5xl leading-none text-orange-deep text-comic-shadow sm:text-7xl">
          {TITLE.split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -90, rotate: -25 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.35 + i * 0.05,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="inline-block"
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, x: 220, rotate: 10 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-2"
        >
          <Image
            src="/brand/logo-full.png"
            alt="Easy Cards — Dragonite mascote com cards Pokémon"
            width={727}
            height={724}
            loading="eager"
            className="mx-auto w-56 drop-shadow-[0_18px_30px_rgba(217,102,11,0.35)] sm:w-72"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mt-4 max-w-xl text-balance text-base text-ink-muted sm:text-lg"
        >
          Compra, venda e troca de cards Pokémon, oficinas pra quem tá
          começando e leilões toda semana — tudo direto com a galera, no
          WhatsApp.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.65 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <a
            href={SITE.whatsappGroup}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal/25 transition-transform hover:scale-105 active:scale-95"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Entrar no grupo do WhatsApp
          </a>
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface-alt active:scale-95"
          >
            <InstagramIcon className="h-5 w-5" />
            Ver no Instagram
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.8 }}
        className="relative mt-12 flex flex-wrap items-center justify-center gap-3 px-5"
      >
        {BADGES.map((b) => (
          <span
            key={b.label}
            className="flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 text-xs font-bold text-ink-muted sm:text-sm"
          >
            <b.Icon className="h-3.5 w-3.5 text-orange-deep" />
            {b.label}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
