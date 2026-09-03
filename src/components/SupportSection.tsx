"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { Sunburst } from "./Sunburst";
import { WhatsAppIcon } from "./icons";
import { randomCardImageUrls } from "@/lib/tcg-cards";

const BG_CARD_SLOTS = [
  { pos: "bottom-6 right-8", rotate: -10, w: "w-32 sm:w-44", z: 1 },
  { pos: "bottom-2 right-24", rotate: 8, w: "w-28 sm:w-40", z: 2 },
] as const;

export function SupportSection() {
  const [bgCards, setBgCards] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setBgCards(randomCardImageUrls(BG_CARD_SLOTS.length)));
  }, []);

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative grid overflow-hidden rounded-[2rem] border-2 border-ink/10 bg-orange lg:grid-cols-2">
          <div className="pointer-events-none absolute -left-24 top-1/2 h-[460px] w-[460px] -translate-y-1/2">
            <Sunburst />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-25">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative flex flex-col justify-center px-6 py-14 text-blue-dark sm:px-12"
          >
            <span className="inline-block w-fit -rotate-2 rounded-full border-2 border-blue-dark bg-cream px-4 py-1 font-comic text-sm">
              Vem ser nosso apoiador
            </span>
            <h2 className="mt-5 font-display text-4xl leading-[0.98] text-cream text-comic-shadow sm:text-5xl">
              LEILÕES, EVENTOS
              <br />
              E UM PÚBLICO QUE
              <br />
              JÁ AMA TCG.
            </h2>
            <p className="mt-5 max-w-sm text-sm font-medium text-blue-dark/90">
              Sua marca ou loja apoiando oficinas e leilões da Easy Cards,
              direto pra quem já é apaixonado por Pokémon TCG. Bora
              conversar sobre parceria?
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apoiador"
                className="flex items-center justify-center gap-2 rounded-full bg-blue-dark px-6 py-3 text-sm font-bold text-cream transition-transform hover:scale-105 active:scale-95"
              >
                Ver como funciona
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border-2 border-blue-dark px-6 py-3 text-sm font-bold text-blue-dark transition-transform hover:scale-105 hover:bg-cream/40 active:scale-95"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Quero ser apoiador
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative flex items-end justify-center px-6 pb-0 lg:pb-6"
          >
            <Image
              src="/brand/logo-full.png"
              alt="Mascote Easy Cards esperando por você"
              width={727}
              height={724}
              className="w-56 drop-shadow-[0_16px_24px_rgba(22,48,92,0.35)] sm:w-72"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
