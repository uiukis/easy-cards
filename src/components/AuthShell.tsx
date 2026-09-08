"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Sunburst } from "./Sunburst";
import { ThemeToggle } from "./ThemeToggle";
import { randomCardImageUrls } from "@/lib/tcg-cards";

// Decorative card art peeking in from the edges, mirroring the Hero.
// Desktop only — kept well clear of the centred form column.
const CARD_SLOTS = [
  { pos: "left-[5%] top-[13%]", rotate: -13, delay: 0.2, w: "w-32 xl:w-40" },
  { pos: "left-[8%] bottom-[9%]", rotate: 8, delay: 0.5, w: "w-28 xl:w-36" },
  { pos: "right-[6%] top-[11%]", rotate: 11, delay: 0.35, w: "w-32 xl:w-40" },
  { pos: "right-[8%] bottom-[12%]", rotate: -9, delay: 0.6, w: "w-28 xl:w-36" },
] as const;

export function AuthShell({
  title,
  tagline,
  subtitle,
  children,
  footer,
}: {
  title: string;
  tagline?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [cards, setCards] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setCards(randomCardImageUrls(CARD_SLOTS.length)));
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-5 py-12">
      {/* comic sunburst rays behind everything, halftone dots on top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2"
      >
        <Sunburst />
      </motion.div>
      <div className="bg-halftone pointer-events-none absolute inset-0 opacity-60" />

      {/* faded, tilted card art at the edges (one flattened layer) */}
      <div className="pointer-events-none absolute inset-0 hidden opacity-40 lg:block">
        {CARD_SLOTS.map((slot, i) =>
          cards[i] ? (
            <motion.img
              key={slot.pos}
              src={cards[i]}
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.85, rotate: slot.rotate - 6, y: 16 }}
              animate={{ opacity: 1, scale: 1, rotate: slot.rotate, y: 0 }}
              transition={{ duration: 0.9, delay: slot.delay, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute ${slot.pos} ${slot.w} rounded-lg shadow-xl shadow-black/20`}
            />
          ) : null
        )}
      </div>

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link
          href="/"
          className="mb-5 flex items-center justify-center gap-2 transition-transform hover:scale-105"
        >
          <Image
            src="/brand/icon-square.png"
            alt="Easy Cards"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-comic-shadow-sm font-display text-xl tracking-wide text-orange-deep">
            EASY <span className="text-orange">CARDS</span>
          </span>
        </Link>

        <div className="rounded-3xl border-2 border-ink/10 bg-surface p-6 shadow-xl shadow-black/10 ring-1 ring-black/5 sm:p-7 dark:shadow-black/30">
          <div className="text-center">
            {tagline && (
              <span className="mb-3 inline-block -rotate-1 rounded-full border-2 border-blue-dark bg-yellow px-3 py-1 font-comic text-xs tracking-wide text-blue-dark shadow-[2px_2px_0_var(--blue-dark)]">
                {tagline}
              </span>
            )}
            <h1 className="font-display text-3xl tracking-wide text-ink text-comic-shadow-sm">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
          </div>

          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-xs text-ink-muted">{footer}</div>}
      </motion.div>
    </main>
  );
}

/** Input styling tuned for the roomier auth forms (vs. the compact
 *  admin-table Input default). */
export const authFieldClass =
  "h-11 rounded-xl border-2 border-ink/15 bg-bg px-3.5 text-sm focus-visible:border-orange-deep dark:bg-bg";
