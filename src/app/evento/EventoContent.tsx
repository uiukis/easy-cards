"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Flag,
  Users,
  ClipboardList,
  DoorOpen,
  Gift,
  Mic,
  PartyPopper,
  GraduationCap,
  Store,
  ArrowRight,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Sunburst } from "@/components/Sunburst";
import { WhatsAppIcon, InstagramIcon } from "@/components/icons";
import { SITE, NEXT_EVENT, LARA_INSTAGRAM, EVENT_FORM_URL } from "@/lib/site";
import type { EventSettings, Supporter } from "@/lib/supabase/types";
import { formatDatePt } from "@/lib/format";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6 },
};

const OBJETIVOS = [
  {
    Icon: Flag,
    title: "Não é campeonato",
    desc: "Sem disputa por prêmio ou ranqueamento. O foco é 100% educativo e social.",
  },
  {
    Icon: GraduationCap,
    title: "Aprendizado prático",
    desc: "Partidas 1x1 com decks de treino da Easy Cards. Ninguém precisa ter cartas próprias.",
  },
  {
    Icon: Users,
    title: "Para todos",
    desc: "Crianças acompanhadas de seus pais e adultos, com mínimo de 20 participantes confirmados.",
  },
];

const TURMAS = [
  {
    Icon: ClipboardList,
    title: "Lista de inscritos",
    value: "20",
    unit: "pessoas · 2 equipes de 5 pares",
    desc: "Abrimos uma lista de interessados com antecedência. Formamos 2 equipes de 5 pares cada, acompanhadas por um professor por equipe.",
  },
  {
    Icon: DoorOpen,
    title: "Mesa extra (quem chegar no dia)",
    value: "+5",
    unit: "pares · sem inscrição prévia",
    desc: "Reservamos uma mesa extra para até 5 pares de quem aparecer sem estar na lista. Uma pessoa extra da equipe é convidada só para ensinar esse grupo.",
  },
];

const ENSINO = [
  {
    n: "01",
    title: "Tipos de carta",
    desc: "Pokémon, Item, Apoiador, Estádio e Ferramenta. Explicação do que cada um faz.",
  },
  {
    n: "02",
    title: "Como funciona um turno",
    desc: "A sequência de ações que cada jogador realiza no jogo.",
  },
  {
    n: "03",
    title: "Caixas de regra",
    desc: "Como energizar as cartas e aplicar as regras durante a partida.",
  },
  {
    n: "04",
    title: "Regras de “letrinhas miúdas”",
    desc: "Detalhes específicos do jogo, explicados de forma simples.",
  },
];

const FLUXO = [
  { n: 1, title: "Entrada", desc: "Participantes chegam pela entrada do evento. Sem ponto de recepção separado." },
  { n: 2, title: "Montagem dos lojistas", desc: "Apoiadores organizam suas mesas de exposição." },
  { n: 3, title: "Formação das turmas", desc: "2 equipes de 5 pares (lista) + mesa extra de 5 pares (quem chegou no dia)." },
  { n: 4, title: "Aula prática 1x1", desc: "Professores conduzem as partidas de aprendizado com decks de treino." },
  { n: 5, title: "Sorteio ao vivo", desc: "Lara anuncia no microfone números grátis (alunos) e pagos (produtos dos apoiadores)." },
  { n: 6, title: "Encerramento", desc: "Agradecimentos e convite para os próximos eventos da Easy Cards." },
];

const EQUIPE_APOIO = [
  { name: "Amanda", role: "Assessoria e Relações Públicas" },
  { name: "Lara", role: "Apresentadora e cobertura de evento", instagram: LARA_INSTAGRAM },
  { name: "Beatriz", role: "Fotografia e cobertura de evento" },
  { name: "Tory", role: "Caixa e atendimento" },
  { name: "Manel", role: "Atendimento e suporte financeiro" },
  { name: "Bão Santos", role: "Atendimento e suporte" },
];


export function EventoContent({
  eventSettings,
  supporters = [],
}: {
  eventSettings?: EventSettings | null;
  supporters?: Supporter[];
}) {
  const title = eventSettings?.title || NEXT_EVENT.title;
  const dateDisplay = eventSettings?.event_date ? formatDatePt(eventSettings.event_date) : NEXT_EVENT.date;
  const place = eventSettings?.place || NEXT_EVENT.place;
  const tag = eventSettings?.tag || NEXT_EVENT.tag;
  const formUrl = eventSettings?.form_url || EVENT_FORM_URL;

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

          <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block rounded-full border-2 border-blue-dark bg-yellow px-4 py-1.5 font-comic text-sm text-blue-dark shadow-[3px_3px_0_var(--blue-dark)]"
            >
              Easy Cards apresenta
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 font-display text-5xl leading-[0.95] text-orange-deep text-comic-shadow sm:text-7xl"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-5 max-w-xl text-balance text-base text-ink-muted sm:text-lg"
            >
              Uma tarde para quem ama Pokémon e quer aprender a jogar TCG do
              zero, no Shopping RioMar Kennedy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3"
            >
              <span className="flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 text-sm font-bold text-ink">
                <Calendar className="h-4 w-4 text-orange-deep" />
                {dateDisplay}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 text-sm font-bold text-ink">
                <MapPin className="h-4 w-4 text-orange-deep" />
                {place}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 text-sm font-bold text-ink">
                <Flag className="h-4 w-4 text-orange-deep" />
                {tag}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal/25 transition-transform hover:scale-105 active:scale-95"
              >
                <ClipboardList className="h-5 w-5" />
                Fazer minha inscrição
              </a>
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface-alt active:scale-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Tirar dúvidas no grupo
              </a>
            </motion.div>
          </div>
        </section>

        {/* sobre */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-2xl">
              <span className="font-comic text-sm tracking-wide text-teal">
                ★ Sobre o evento
              </span>
              <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                A EASY CARDS É UMA COMUNIDADE DE COLECIONADORES E JOGADORES
                DE TCG.
              </h2>
              <p className="mt-4 text-ink-muted">
                Com foco em Pokémon, queremos aproximar pessoas de todas as
                idades do universo do colecionismo, de forma acessível e
                divertida. Esse é o nosso primeiro evento presencial —
                pensado pra ensinar, na prática, quem nunca jogou ou quer
                aprender mais.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {OBJETIVOS.map((o, i) => (
                <motion.div
                  key={o.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border-2 border-ink/10 bg-surface p-6"
                >
                  <o.Icon className="h-6 w-6 text-orange-deep" />
                  <h3 className="mt-3 font-display text-lg tracking-wide text-ink">
                    {o.title.toUpperCase()}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{o.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* turmas */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="font-comic text-sm tracking-wide text-orange-deep">
                ★ Como funcionam as turmas
              </span>
              <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                INSCRIÇÃO PRÉVIA + ESPAÇO PRA QUEM CHEGAR NO DIA.
              </h2>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {TURMAS.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border-2 border-ink/10 bg-surface p-6"
                >
                  <t.Icon className="h-6 w-6 text-orange-deep" />
                  <div className="mt-3 font-display text-4xl text-orange-deep">
                    {t.value}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                    {t.unit}
                  </p>
                  <h3 className="mt-3 font-display text-lg tracking-wide text-ink">
                    {t.title.toUpperCase()}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{t.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-4 inline-flex items-center gap-2 font-bold text-teal underline-offset-2 hover:underline"
            >
              <ClipboardList className="h-4 w-4" />
              Entrar na lista de inscritos
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 rounded-2xl border-2 border-yellow bg-yellow/15 p-5 text-sm font-medium text-ink"
            >
              <strong>Atenção:</strong> quem quiser jogar precisa chegar
              cedo. O primeiro tempo será destinado às regras do jogo e à
              explicação de como funciona. Quem chegar atrasado perde a
              explicação e o lugar na mesa.
            </motion.div>
          </div>
        </section>

        {/* ensino */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="font-comic text-sm tracking-wide text-teal">
                ★ O que será ensinado
              </span>
              <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                TEORIA SIMPLIFICADA + PRÁTICA GUIADA, EM PARTIDAS 1X1.
              </h2>
            </motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ENSINO.map((e, i) => (
                <motion.div
                  key={e.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex gap-4 rounded-2xl border-2 border-ink/10 bg-surface p-6"
                >
                  <span className="font-display text-2xl text-orange-deep">
                    {e.n}
                  </span>
                  <div>
                    <h3 className="font-display text-lg tracking-wide text-ink">
                      {e.title.toUpperCase()}
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">{e.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 text-center text-sm italic text-ink-muted"
            >
              Ensino em rodadas de teoria e prática que se revezam, com
              pausas ao longo da tarde — um professor conduz a teoria,
              outro a prática, sempre acompanhando até 5 duplas por vez.
            </motion.p>
          </div>
        </section>

        {/* fluxo */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="font-comic text-sm tracking-wide text-orange-deep">
                ★ Fluxo do evento
              </span>
              <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                COMO O DIA 19 VAI ACONTECER, DO INÍCIO AO FIM.
              </h2>
            </motion.div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FLUXO.map((f, i) => (
                <motion.div
                  key={f.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="rounded-2xl border-2 border-ink/10 bg-surface p-6"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange font-display text-sm text-blue-dark">
                    {f.n}
                  </span>
                  <h3 className="mt-3 font-display text-base tracking-wide text-ink">
                    {f.title.toUpperCase()}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* sorteio */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="overflow-hidden rounded-[2rem] border-2 border-ink/10 bg-blue-dark px-6 py-12 text-cream sm:px-14">
              <motion.div {...fadeUp} className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border-2 border-yellow/60 bg-yellow/10 px-4 py-1.5 font-comic text-sm text-yellow">
                  <Mic className="h-4 w-4" />
                  Sorteio ao vivo
                </div>
                <h2 className="mt-4 font-display text-3xl leading-[1.02] sm:text-4xl">
                  ANUNCIADO NO MICROFONE, CONDUZIDO PELA LARA.
                </h2>
                <a
                  href={LARA_INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cream/70 underline-offset-2 hover:text-cream hover:underline"
                >
                  <InstagramIcon className="h-4 w-4" />
                  @larita.tcg
                </a>
              </motion.div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl border border-cream/15 bg-cream/5 p-5"
                >
                  <Gift className="h-6 w-6 text-yellow" />
                  <h3 className="mt-2 text-sm font-bold uppercase tracking-wide text-cream">
                    Número grátis
                  </h3>
                  <p className="mt-2 text-sm text-cream/70">
                    Cada participante do evento recebe um número grátis pro
                    sorteio dos produtos doados pelos apoiadores.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="rounded-2xl border border-cream/15 bg-cream/5 p-5"
                >
                  <PartyPopper className="h-6 w-6 text-yellow" />
                  <h3 className="mt-2 text-sm font-bold uppercase tracking-wide text-cream">
                    Números extras
                  </h3>
                  <p className="mt-2 text-sm text-cream/70">
                    Quer mais chances? Cada participante pode comprar até 2
                    números extras, R$5 cada.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* equipe */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="font-comic text-sm tracking-wide text-teal">
                ★ Equipe responsável
              </span>
              <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                INSTRUTORES COM EXPERIÊNCIA REAL NO MERCADO TCG.
              </h2>
            </motion.div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border-2 border-ink/10 bg-ink p-6 text-bg"
              >
                <p className="font-display text-base tracking-wide">VINI</p>
                <p className="mt-1 text-sm text-bg/70">
                  Experiente no universo Pokémon TCG e jogador competitivo
                  em torneios.
                </p>
                <p className="mt-4 flex items-center gap-1.5 font-display text-base tracking-wide">
                  <ShieldCheck className="h-4 w-4 text-orange-light" />
                  JOÃO PEDRO
                </p>
                <p className="mt-1 text-sm text-bg/70">
                  Juiz oficial certificado pela Pokémon Company. Professor(a)
                  convidado(a).
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border-2 border-ink/10 bg-blue-dark p-6 text-cream"
              >
                <p className="font-display text-base tracking-wide">
                  EQUIPE DE APOIO
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-cream/80">
                  {EQUIPE_APOIO.map((p) => (
                    <li key={p.name} className="flex items-center gap-1.5">
                      {p.instagram ? (
                        <a
                          href={p.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-cream underline-offset-2 hover:underline"
                        >
                          <InstagramIcon className="h-3.5 w-3.5" />
                          {p.name}
                        </a>
                      ) : (
                        <span>{p.name}</span>
                      )}
                      <span>— {p.role}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 text-sm text-ink-muted"
            >
              No dia, de 2 a 4 pessoas conduzem o ensino — os demais cuidam
              de sorteio, som e logística geral. Antes das rodadas
              práticas, a equipe passa por um momento de estudo teórico das
              cartas, pra conduzir bem as 5 duplas por professor.
            </motion.p>
          </div>
        </section>

        {/* apoiadores confirmados */}
        {supporters.length > 0 && (
          <section className="relative py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <motion.div {...fadeUp} className="max-w-xl text-center mx-auto">
                <span className="font-comic text-sm tracking-wide text-orange-deep">
                  ★ Já confirmaram presença
                </span>
                <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
                  LOJISTAS APOIADORES
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-3"
              >
                {supporters.map((s) => (
                  <a
                    key={s.id}
                    href={s.instagram ?? undefined}
                    target={s.instagram ? "_blank" : undefined}
                    rel={s.instagram ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2 rounded-full border-2 border-ink/10 bg-surface px-5 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-105"
                  >
                    <Store className="h-4 w-4 text-orange-deep" />
                    {s.name}
                  </a>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* cta final */}
        <section className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <Layers className="mx-auto h-8 w-8 text-orange-deep" />
            <h2 className="mt-4 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
              VAMOS JUNTOS?
            </h2>
            <p className="mt-3 text-ink-muted">
              A Easy Cards está à disposição pra alinhar qualquer detalhe.
              Faz sua inscrição ou tira dúvidas direto no grupo.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal/25 transition-transform hover:scale-105 active:scale-95"
              >
                <ClipboardList className="h-5 w-5" />
                Fazer minha inscrição
              </a>
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface-alt active:scale-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Entrar no grupo
              </a>
              <Link
                href="/apoiador"
                className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface-alt active:scale-95"
              >
                Quero ser apoiador
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
