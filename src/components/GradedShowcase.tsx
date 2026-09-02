"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { randomCardImageUrls } from "@/lib/tcg-cards";

const SLABS = [
  { grade: "10", label: "GEM MINT", rotate: -6 },
  { grade: "9.5", label: "MINT+", rotate: 3 },
  { grade: "10", label: "PRISTINE", rotate: -2 },
  { grade: "9", label: "MINT", rotate: 5 },
];

export function GradedShowcase() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setImages(randomCardImageUrls(SLABS.length)));
  }, []);

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-xl text-center"
        >
          <span className="font-comic text-sm tracking-wide text-orange-deep">
            ★ Já rolou por aqui
          </span>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
            TEVE SORTEIO DE
            <br />
            <span className="text-orange-deep">CARD GRADUADO.</span>
          </h2>
          <p className="mt-4 text-ink-muted">
            De vez em quando a gente sorteia card graduado pra galera do
            grupo — nota alta, peça de vitrine. Fica de olho que o
            próximo sorteio pode ser o seu.
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {SLABS.map((slab, i) => (
            <motion.div
              key={slab.label + i}
              initial={{ opacity: 0, y: 30, rotate: slab.rotate - 6 }}
              whileInView={{ opacity: 1, y: 0, rotate: slab.rotate }}
              whileHover={{ rotate: 0, scale: 1.05 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="w-36 shrink-0 rounded-2xl border-2 border-ink/15 bg-surface p-2 shadow-lg shadow-black/10 sm:w-44"
            >
              <div className="flex items-center justify-between rounded-lg bg-ink px-2 py-1.5 text-bg">
                <span className="font-display text-[10px] tracking-widest">
                  EASY CARDS
                </span>
                <span className="font-display text-sm text-yellow">
                  {slab.grade}
                </span>
              </div>
              <div className="mt-2 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-surface-alt">
                {images[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[i]}
                    alt="Card graduado sorteado"
                    className="h-full w-full object-contain p-1"
                  />
                ) : null}
              </div>
              <p className="mt-2 text-center font-display text-xs tracking-wide text-ink-muted">
                {slab.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
