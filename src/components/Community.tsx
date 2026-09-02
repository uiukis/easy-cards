"use client";

import { motion } from "motion/react";
import { SITE } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "./icons";

const STATS = [
  { value: "100%", label: "Negociação direta, sem taxa escondida" },
  { value: "Pix", label: "Ou combinado, do jeito que for melhor pra você" },
  { value: "24h", label: "Grupo ativo com resposta rápida" },
];

export function Community() {
  return (
    <section id="comunidade" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[2.5rem] border-2 border-ink/10 bg-surface-alt p-10 sm:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="font-comic text-sm tracking-wide text-teal">
              ★ A comunidade
            </span>
            <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
              QUEM COLECIONA JUNTO,
              <br />
              <span className="text-teal">TROCA MELHOR.</span>
            </h2>
            <p className="mt-5 text-ink-muted">
              Acompanhe novidades, eventos e bastidores no Instagram, e
              entre pro grupo do WhatsApp pra fazer parte das negociações,
              leilões e do bate-papo do dia a dia.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border-2 border-ink/10 bg-surface p-6 text-center"
              >
                <div className="font-display text-3xl text-orange-deep">{s.value}</div>
                <p className="mt-2 text-sm text-ink-muted">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a
              href={SITE.whatsappGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal/20 transition-transform hover:scale-105 active:scale-95 sm:w-auto"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Entrar no grupo
            </a>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink/15 px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface active:scale-95 sm:w-auto"
            >
              <InstagramIcon className="h-5 w-5" />
              {SITE.instagramHandle}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
