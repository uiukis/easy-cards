"use client";

import { motion } from "motion/react";
import { Gavel, CalendarClock } from "lucide-react";
import type { Auction } from "@/lib/supabase/types";
import { SITE } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

function FeaturedAuction({ a }: { a: Auction }) {
  const when = a.happens_at
    ? new Date(a.happens_at).toLocaleString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto mb-6 max-w-6xl px-5 sm:px-8"
    >
      <div className="flex flex-col gap-5 overflow-hidden rounded-[2rem] border-2 border-orange-deep bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        {a.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided image
          <img
            src={a.image_url}
            alt=""
            className="h-40 w-full shrink-0 rounded-2xl object-cover sm:h-32 sm:w-48"
          />
        )}
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-deep/10 px-3 py-1 font-comic text-xs tracking-wide text-orange-deep">
            <Gavel className="h-3.5 w-3.5" />
            {a.result ? "Último leilão" : "Próximo leilão"}
          </span>
          <h3 className="mt-2 font-display text-2xl leading-tight text-ink text-comic-shadow-sm">
            {a.title}
          </h3>
          {when && !a.result && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
              <CalendarClock className="h-4 w-4 text-orange-deep" />
              {when}
            </p>
          )}
          {a.note && <p className="mt-1.5 text-sm text-ink-muted">{a.note}</p>}
          {a.result && <p className="mt-1.5 text-sm font-semibold text-teal">{a.result}</p>}
        </div>
        {!a.result && (
          <a
            href={SITE.whatsappGroup}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-teal px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal/20 transition-transform hover:scale-105 active:scale-95"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Dar lance no grupo
          </a>
        )}
      </div>
    </motion.div>
  );
}

const RULES = [
  {
    title: "Foto do lote",
    desc: "O card ou lote entra no grupo com foto — tudo visível antes de qualquer voto.",
  },
  {
    title: "Enquete com valores",
    desc: "Abre uma enquete no WhatsApp com faixas de preço — você vota na que topa pagar.",
  },
  {
    title: "Pagamento combinado",
    desc: "Quem levou paga por Pix na data que a equipe define. Simples assim.",
  },
];

export function AuctionsSection({ featured }: { featured?: Auction | null }) {
  return (
    <section id="leiloes" className="relative py-20 sm:py-28">
      {featured && <FeaturedAuction a={featured} />}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[2rem] border-2 border-ink/10 bg-blue-dark px-6 py-14 text-cream sm:px-14">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-yellow/60 bg-yellow/10 px-4 py-1.5 font-comic text-sm text-yellow">
                <Gavel className="h-4 w-4" />
                Leilão Easy Cards
              </div>
              <h2 className="mt-4 font-display text-4xl leading-[1.02] sm:text-5xl">
                TODA SEMANA
                <br />
                <span className="text-yellow">TEM LEILÃO NO GRUPO.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm text-cream/80">
                Nada de lance gritado: o leilão roda por enquete no
                WhatsApp. A gente posta a foto do lote, abre as opções de
                valor e quem vota na faixa vencedora leva pra casa.
              </p>
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-yellow px-6 py-3 text-sm font-bold text-blue-dark transition-transform hover:scale-105 active:scale-95"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Participar do próximo leilão
              </a>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3">
              {RULES.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border border-cream/15 bg-cream/5 p-5"
                >
                  <span className="font-display text-2xl text-orange-light">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-sm font-bold uppercase tracking-wide text-cream">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-xs text-cream/70">{r.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
