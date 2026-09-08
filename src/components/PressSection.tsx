import Link from "next/link";
import { Newspaper, ArrowRight, ExternalLink } from "lucide-react";
import type { PressMention } from "@/lib/supabase/types";

export function PressSection({ mentions }: { mentions: PressMention[] }) {
  if (mentions.length === 0) return null;

  return (
    <section id="imprensa" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-comic text-sm tracking-wide text-orange-deep">★ Na mídia</span>
            <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
              QUEM JÁ FALOU
              <br />
              SOBRE A GENTE.
            </h2>
          </div>
          {mentions.length > 3 && (
            <Link
              href="/imprensa"
              className="flex items-center gap-1.5 text-sm font-bold text-orange-deep hover:underline"
            >
              Ver todas as matérias
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mentions.slice(0, 3).map((m) => (
            <PressCard key={m.id} mention={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function PressCard({ mention: m }: { mention: PressMention }) {
  return (
    <a
      href={m.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface transition-transform hover:-translate-y-1 hover:shadow-lg"
    >
      {m.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
        <img src={m.image_url} alt={m.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-surface-alt">
          <Newspaper className="h-8 w-8 text-ink-muted" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-bold uppercase tracking-wide text-orange-deep">{m.outlet}</span>
        <h3 className="mt-1.5 line-clamp-3 font-display text-base leading-tight text-ink">{m.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-ink-muted">
          <span>{m.journalist ?? " "}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </a>
  );
}
