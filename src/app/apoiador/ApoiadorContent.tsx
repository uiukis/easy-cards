"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Handshake,
  Gift,
  Store,
  MessagesSquare,
  Gavel,
  Megaphone,
  ArrowRight,
  Percent,
  Sparkle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Sunburst } from "@/components/Sunburst";
import { WhatsAppIcon, InstagramIcon } from "@/components/icons";
import { SITE, NEXT_EVENT, LARA_INSTAGRAM } from "@/lib/site";
import type { Supporter } from "@/lib/supabase/types";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6 },
};

const NO_DIA = [
  {
    Icon: Gift,
    title: "Contribuição pro sorteio",
    desc: "Cada apoiador contribui com um produto da própria loja pro sorteio realizado durante o evento. Não precisa ser caro ou exclusivo — a escolha é sua.",
  },
  {
    Icon: Store,
    title: "Espaço para exposição",
    desc: "Mesa de exposição pra apresentar e vender seus próprios produtos. Taxa simbólica de R$ 10 por mesa, sem cobrança de comissão sobre as vendas feitas no evento.",
  },
];

const DEPOIS = [
  {
    Icon: MessagesSquare,
    title: "Grupo de vendas",
    desc: "Divulgue os produtos da sua loja no grupo de VENDAS da Easy Cards, ampliando o contato direto com jogadores e colecionadores.",
  },
  {
    Icon: Gavel,
    title: "Leilões e ações da Easy Cards",
    desc: "Participe das ações comerciais organizadas pela Easy Cards, incluindo leilões e rifas, aproximando seus produtos de uma comunidade já interessada em TCG.",
  },
  {
    Icon: Megaphone,
    title: "Divulgação com a Lara",
    desc: "Nossa apresentadora pode fazer menções rápidas nos Stories pra apresentar ofertas e produtos dos apoiadores, no Instagram e no WhatsApp.",
    note: "Conteúdos específicos de influenciadora — reviews, unboxings — são negociados diretamente com a Lara e não fazem parte dessa parceria.",
    instagram: LARA_INSTAGRAM,
  },
];

const LEILOES = [
  {
    title: "Leilão misto",
    comissao: "20%",
    desc: "Produtos da Easy Cards + produtos do apoiador, no mesmo leilão.",
    detail: "Sem restrição de valor pra produtos lacrados. Cartas avulsas exigem valor mínimo de R$ 200 no lote.",
  },
  {
    title: "Leilão exclusivo",
    comissao: "35%",
    desc: "Leilão realizado só com produtos do apoiador.",
    detail: "A comissão cobre a estrutura da ação: divulgação, condução do leilão e operação da equipe.",
  },
];

export function ApoiadorContent({
  supporters = [],
}: {
  supporters?: Supporter[];
}) {
  const eventDate = NEXT_EVENT.date;
  const eventPlace = NEXT_EVENT.place;
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* hero */}
        <section className="relative overflow-hidden pt-16 pb-16 sm:pt-20 sm:pb-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 opacity-70">
            <Sunburst />
          </div>
          <div className="bg-halftone pointer-events-none absolute inset-0 opacity-60" />

          <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block rounded-full border-2 border-blue-dark bg-yellow px-4 py-1.5 font-comic text-sm text-blue-dark shadow-[3px_3px_0_var(--blue-dark)]"
            >
              <Handshake className="mr-1 inline h-4 w-4" />
              Seja um apoiador
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 font-display text-4xl leading-[0.98] text-orange-deep text-comic-shadow sm:text-6xl"
            >
              APROXIME SUA LOJA DA COMUNIDADE POKÉMON TCG.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-5 max-w-xl text-balance text-base text-ink-muted sm:text-lg"
            >
              Faça parte do nosso primeiro evento presencial — {eventDate}, no {eventPlace} — e das ações da Easy Cards ao longo do ano. Apresente seus produtos a jogadores, colecionadores e novos interessados no hobby.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal/25 transition-transform hover:scale-105 active:scale-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Quero ser apoiador
              </a>
              <Link
                href="/evento"
                className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface-alt active:scale-95"
              >
                Ver o evento
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* o que significa */}
        <section className="relative py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <motion.p {...fadeUp} className="text-ink-muted">
              Ser apoiador da Easy Cards é uma oportunidade de aproximar sua
              loja da comunidade de Pokémon TCG, apresentar seus produtos ao
              público e participar de eventos pensados pra reunir
              jogadores, colecionadores e novos interessados no hobby.
            </motion.p>
          </div>
        </section>

        {/* no dia do evento */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="font-comic text-sm tracking-wide text-teal">
                ★ No dia do evento
              </span>
              <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                DUAS FORMAS DE PARTICIPAR PRESENCIALMENTE.
              </h2>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {NO_DIA.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border-2 border-ink/10 bg-surface p-6"
                >
                  <item.Icon className="h-6 w-6 text-orange-deep" />
                  <h3 className="mt-3 font-display text-lg tracking-wide text-ink">
                    {item.title.toUpperCase()}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* depois do evento */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="font-comic text-sm tracking-wide text-orange-deep">
                ★ E depois do evento?
              </span>
              <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                SER APOIADOR TAMBÉM VALE PRO DIA A DIA DA COMUNIDADE.
              </h2>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {DEPOIS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border-2 border-ink/10 bg-surface p-6"
                >
                  <item.Icon className="h-6 w-6 text-orange-deep" />
                  <h3 className="mt-3 font-display text-base tracking-wide text-ink">
                    {item.title.toUpperCase()}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{item.desc}</p>
                  {item.instagram && (
                    <a
                      href={item.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-deep underline-offset-2 hover:underline"
                    >
                      @larita.tcg
                    </a>
                  )}
                  {item.note && (
                    <p className="mt-3 rounded-lg bg-surface-alt p-3 text-xs text-ink-muted">
                      {item.note}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* leilões */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="overflow-hidden rounded-[2rem] border-2 border-ink/10 bg-blue-dark px-6 py-12 text-cream sm:px-14">
              <motion.div {...fadeUp} className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border-2 border-yellow/60 bg-yellow/10 px-4 py-1.5 font-comic text-sm text-yellow">
                  <Gavel className="h-4 w-4" />
                  Produtos nos leilões
                </div>
                <h2 className="mt-4 font-display text-3xl leading-[1.02] sm:text-4xl">
                  DISPONIBILIZE CARTAS, BOOSTERS E OUTROS ITENS.
                </h2>
                <p className="mt-3 text-sm text-cream/80">
                  Seus produtos entram nos leilões realizados pela Easy
                  Cards, escolhendo o formato que faz mais sentido pra
                  você.
                </p>
              </motion.div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {LEILOES.map((l, i) => (
                  <motion.div
                    key={l.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="rounded-2xl border border-cream/15 bg-cream/5 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg tracking-wide text-cream">
                        {l.title.toUpperCase()}
                      </h3>
                      <span className="flex items-center gap-1 font-display text-2xl text-yellow">
                        <Percent className="h-4 w-4" />
                        {l.comissao}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-cream/80">{l.desc}</p>
                    <p className="mt-3 text-xs text-cream/60">{l.detail}</p>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="mt-6 text-sm text-cream/70"
              >
                Caso esses percentuais não façam sentido pro seu formato de
                trabalho, podemos conversar e avaliar a melhor possibilidade
                pra parceria.
              </motion.p>
            </div>
          </div>
        </section>

        {/* apoiadores atuais */}
        {supporters.length > 0 && (
          <section className="relative py-16 sm:py-20">
            <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
              <Handshake className="mx-auto h-8 w-8 text-orange-deep" />
              <motion.h2
                {...fadeUp}
                className="mt-4 font-display text-3xl leading-[1.02] text-ink sm:text-4xl"
              >
                QUEM JÁ APOIA A EASY CARDS
              </motion.h2>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                {supporters.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={s.instagram ?? undefined}
                    target={s.instagram ? "_blank" : undefined}
                    rel={s.instagram ? "noopener noreferrer" : undefined}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="group flex flex-col items-center gap-2"
                  >
                    {s.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                      <img
                        src={s.image_url}
                        alt={s.name}
                        className="h-16 w-16 rounded-full border-2 border-ink/10 object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink/10 bg-surface font-display text-lg text-orange-deep">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                      {s.name}
                      {s.instagram && <InstagramIcon className="h-3 w-3 text-ink-muted" />}
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* por que apoiar */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <Sparkle className="mx-auto h-8 w-8 text-orange-deep" />
            <motion.h2
              {...fadeUp}
              className="mt-4 font-display text-3xl leading-[1.02] text-ink sm:text-4xl"
            >
              POR QUE APOIAR A EASY CARDS?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-ink-muted"
            >
              Porque você não estará apenas divulgando sua loja. Você
              estará ajudando a apresentar o Pokémon TCG pra novos
              jogadores, fortalecer a comunidade local e criar novas
              conexões com pessoas que têm interesse real em jogar e
              colecionar. É uma oportunidade de colocar sua loja dentro da
              experiência — não só como uma marca divulgando o evento.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal/25 transition-transform hover:scale-105 active:scale-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Fale com a gente pelo grupo
              </a>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
