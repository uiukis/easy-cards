import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, User, BookOpen, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Novidades — Easy Cards",
  description: "O que o site da Easy Cards já faz pela comunidade.",
};

const FICHARIO_ITEMS = [
  "Grade que você escolhe: 2×2, 3×3, 4×3, 4×4, 4×5, 5×4",
  "Vários fichários por conta (coleção geral, master set, um Pokémon só…)",
  "Arrasta pra organizar (no computador e no celular), desfazer/refazer",
  "Capa personalizada com imagem de fundo, subtítulo e os números ao vivo",
  "Tenho / Quero em cada carta",
  "Slot de imagem: bota arte, foto ou divisória no lugar de uma carta",
  "Slot 2×2 pra toploader e cartas de destaque",
  "Fundo de página, rótulos de página, visão de livro (2 páginas lado a lado)",
  "Adição de cartas em lote com busca e filtro de tipo/raridade/set",
  "Link público do fichário + exportar em PDF",
];

export default function NovidadesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-halftone bg-bg">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <Sparkles className="h-8 w-8 text-orange-deep" />
            <h1 className="mt-4 font-display text-4xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-5xl">
              EASY CARDS — o que o site já faz
            </h1>
            <p className="mt-4 max-w-xl text-ink-muted">
              Desde que abrimos o site, ele deixou de ser só uma página bonita e virou uma ferramenta
              pra comunidade. Resumo de tudo até agora:
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl space-y-6 px-5 pb-20 sm:px-8">
          {/* Sua conta */}
          <article className="rounded-[2rem] border-2 border-ink/10 bg-surface p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-ink">
              <User className="h-5 w-5 text-primary" />
              SUA CONTA
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              Cadastro rápido só com telefone. Portal com “Minhas cartas” (tudo que você comprou/arrematou
              com a gente), trocar senha, e o seu Pokémon favorito vira seu avatar no sistema. Errou o
              número no cadastro? Fala com a gente no grupo que a equipe corrige.
            </p>
            <p className="mt-3 rounded-2xl bg-surface-alt p-3 text-sm leading-relaxed text-ink">
              <span className="font-bold text-orange-deep">Arrematou uma carta no leilão?</span> Se você
              tem conta e a gente vincula ela ao seu perfil, ela fica salva em “Minhas cartas” — e de lá
              você joga direto pro seu fichário com um toque.
            </p>
          </article>

          {/* Fichário */}
          <article className="rounded-[2rem] border-2 border-ink/10 bg-surface p-6 sm:p-8">
            <h2 className="flex flex-wrap items-center gap-2 font-display text-2xl tracking-wide text-ink">
              <BookOpen className="h-5 w-5 text-primary" />
              FICHÁRIO — MONTE SEU BINDER ONLINE
              <Badge variant="secondary" className="font-comic tracking-wide">
                beta
              </Badge>
            </h2>
            <p className="mt-2 text-xs font-semibold text-ink-muted">
              Ainda em beta, seu feedback é muito importante.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              O carro-chefe. Dá pra testar sem criar conta.
            </p>
            <ul className="mt-4 space-y-2">
              {FICHARIO_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-deep" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Lista de desejo */}
          <article className="rounded-[2rem] border-2 border-ink/10 bg-surface p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-ink">
              <Sparkles className="h-5 w-5 text-primary" />
              LISTA DE DESEJO
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              Cadastra as cartas que você tá caçando, com prioridade. A gente vê e te avisa quando
              aparece. E você pode compartilhar seu perfil (easycards.app/u/seu-nome) com o que você
              quer — ótimo pra trocar e comprar entre a galera da comunidade.
            </p>
          </article>

          <div className="flex justify-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-orange-deep px-6 py-3 font-bold text-white shadow-lg shadow-orange-deep/25 transition-transform hover:scale-105 active:scale-95"
            >
              Ir pro site
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
