"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, Sparkles, LayoutGrid, ArrowRight } from "lucide-react";

const TOOLS = [
  {
    href: "/fichario",
    icon: BookOpen,
    tone: "text-orange-deep",
    ring: "hover:border-orange-deep/50",
    badge: "beta",
    title: "Fichário",
    desc: "Monte seu binder online: grade que você escolhe, capa personalizada, marca tenho/quero em cada carta e compartilha por link. Dá pra testar sem conta.",
    cta: "Montar o meu",
  },
  {
    href: "/cartas",
    icon: LayoutGrid,
    tone: "text-blue-dark",
    ring: "hover:border-blue-dark/40",
    title: "Galeria de cartas",
    desc: "A base completa do TCG. Busca por nome, set, tipo e raridade, vê a arte em alta e quem ilustrou. As raras brilham.",
    cta: "Explorar",
  },
  {
    href: "/lista-de-desejos",
    icon: Sparkles,
    tone: "text-teal",
    ring: "hover:border-teal/50",
    title: "Lista de desejo",
    desc: "Cadastra as cartas que você tá caçando. A gente vê e te avisa quando aparece — e você pode compartilhar seu perfil pra trocar com a galera.",
    cta: "Criar minha lista",
  },
];

export function ToolsSection() {
  return (
    <section id="ferramentas" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <span className="font-comic text-sm tracking-wide text-orange-deep">
            ★ Ferramentas da comunidade
          </span>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-5xl">
            NÃO É SÓ GRUPO —<br />
            <span className="text-orange-deep">É FERRAMENTA.</span>
          </h2>
          <p className="mt-5 text-ink-muted">
            Construímos umas coisas pra deixar a vida de colecionador mais fácil. Tudo de graça, e a
            maioria funciona sem nem criar conta.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TOOLS.map((t, i) => (
            <motion.div
              key={t.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <Link
                href={t.href}
                className={`group flex h-full flex-col rounded-3xl border-2 border-ink/10 bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${t.ring}`}
              >
                <div className="flex items-center gap-2">
                  <t.icon className={`h-7 w-7 ${t.tone}`} />
                  {t.badge && (
                    <span className="rounded-full bg-surface-alt px-2 py-0.5 font-comic text-[10px] tracking-wide text-ink-muted">
                      {t.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-2xl tracking-wide text-ink">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{t.desc}</p>
                <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-bold ${t.tone}`}>
                  {t.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
