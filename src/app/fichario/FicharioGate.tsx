"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, LayoutGrid, Share2, ArrowRight, LogIn } from "lucide-react";
import { randomCardImageUrls } from "@/lib/tcg-cards";

const PERKS = [
  { icon: LayoutGrid, label: "Monte vitrines por set, por Pokémon ou do seu jeito" },
  { icon: BookOpen, label: "Grids de 2×2 a 5×4, páginas, rótulos e visão de livro" },
  { icon: Share2, label: "Link público pra mandar no grupo — sem a pessoa ter conta" },
];

export function FicharioGate() {
  const [cards, setCards] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setCards(randomCardImageUrls(4)));
  }, []);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-block -rotate-1 rounded-full border-2 border-blue-dark bg-yellow px-3 py-1 font-comic text-xs tracking-wide text-blue-dark shadow-[2px_2px_0_var(--blue-dark)]">
          Fichário · beta
        </span>
        <h1 className="mt-4 font-display text-3xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-4xl">
          MONTE SUA VITRINE
          <br />
          DE CARTAS POKÉMON
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
          Organize sua coleção num fichário digital — do seu jeito, e mostra pra galera.
          Precisa de uma conta Easy Cards (é rapidinho, só telefone e senha).
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/cadastro?next=/fichario"
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] active:scale-95"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login?next=/fichario"
            className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-6 py-3 text-sm font-bold text-ink transition-transform hover:scale-[1.03] hover:bg-surface-alt active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            Já tenho conta
          </Link>
        </div>
      </motion.div>

      <div className="mt-10 flex justify-center gap-2 sm:gap-3">
        {cards.map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, y: 20, rotate: (i - 1.5) * 6 }}
            animate={{ opacity: 1, y: 0, rotate: (i - 1.5) * 6 }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="w-20 rounded-lg border-2 border-ink/10 shadow-lg shadow-black/15 sm:w-28"
          />
        ))}
      </div>

      <ul className="mx-auto mt-10 max-w-md space-y-2.5 text-left">
        {PERKS.map((p) => (
          <li
            key={p.label}
            className="flex items-center gap-3 rounded-xl border-2 border-ink/10 bg-surface px-4 py-3"
          >
            <p.icon className="h-4 w-4 shrink-0 text-orange-deep" />
            <span className="text-sm text-ink">{p.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
