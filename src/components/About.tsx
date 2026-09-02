"use client";

import { motion } from "motion/react";
import { SITE } from "@/lib/site";

const PILLARS = [
  {
    title: "Compra",
    desc: "Cards avulsas, coleções e produtos selados direto de quem entende do hobby.",
    color: "bg-orange/15 text-orange-deep",
  },
  {
    title: "Venda",
    desc: "Anuncie sua coleção pro grupo e negocie sem burocracia, no seu tempo.",
    color: "bg-blue/15 text-blue",
  },
  {
    title: "Troca",
    desc: "Encontre exatamente a carta que falta na sua coleção trocando com a galera.",
    color: "bg-teal/15 text-teal",
  },
  {
    title: "Eventos",
    desc: "Oficinas pra aprender a jogar do zero e leilões toda semana no grupo.",
    color: "bg-yellow/25 text-blue-dark",
  },
];

export function About() {
  return (
    <section id="sobre" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-comic text-sm tracking-wide text-orange-deep">
              ★ De colecionador pra colecionador
            </span>
            <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
              CARD NA MÃO,
              <br />
              <span className="text-orange-deep">CONVERSA NO GRUPO,</span>
              <br />
              NEGÓCIO FECHADO.
            </h2>
            <p className="mt-6 max-w-md text-ink-muted">
              A Easy Cards nasceu de gente que abre booster junto e não
              resiste a caçar aquela carta que falta na coleção. O grupo do
              WhatsApp é onde tudo acontece: anúncios, trocas, dúvidas de
              quem tá começando e leilão toda semana.
            </p>
            <a
              href={SITE.whatsappGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-bg transition-transform hover:scale-105 active:scale-95"
            >
              Entrar na comunidade
            </a>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border-2 border-ink/10 bg-surface p-6 transition-colors hover:border-orange/40"
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-base ${p.color}`}
                >
                  {p.title[0]}
                </div>
                <h3 className="font-display text-xl tracking-wide text-ink">
                  {p.title.toUpperCase()}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
