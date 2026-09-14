"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";

export function InstallBanner() {
  return (
    <section className="px-5 pb-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-6xl"
      >
        <Link
          href="/instalar"
          className="group flex flex-col items-center gap-4 rounded-3xl border-2 border-orange-deep/25 bg-orange-deep/5 p-5 text-center transition-colors hover:bg-orange-deep/10 sm:flex-row sm:gap-5 sm:p-6 sm:text-left"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-ink/10 shadow-sm">
            <Image src="/icon-192.png" alt="" fill sizes="56px" className="object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg tracking-wide text-ink">
              LEVA A EASY CARDS NO BOLSO
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Instala o app na tela inicial — de graça, abre rápido, avisa quando sua carta aparece.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-deep px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-deep/25 transition-transform group-hover:scale-105">
            <Download className="h-4 w-4" />
            Instalar
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
