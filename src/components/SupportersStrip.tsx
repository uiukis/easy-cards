import type { Supporter } from "@/lib/supabase/types";
import { InstagramIcon } from "./icons";

export function SupportersStrip({ supporters }: { supporters: Supporter[] }) {
  if (supporters.length === 0) return null;

  return (
    <section id="apoiadores" className="py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <span className="font-comic text-sm tracking-wide text-orange-deep">★ Parceiros</span>
        <h2 className="mt-2 font-display text-3xl leading-[1.02] text-ink sm:text-4xl">
          QUEM JÁ APOIA A EASY CARDS
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Lojas e marcas que caminham com a comunidade.
        </p>

        <div className="mt-9 flex flex-wrap items-start justify-center gap-x-6 gap-y-7 sm:gap-x-9">
          {supporters.map((s) => {
            const Wrapper = s.instagram ? "a" : "div";
            return (
              <Wrapper
                key={s.id}
                {...(s.instagram
                  ? { href: s.instagram, target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex w-24 flex-col items-center gap-2"
              >
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                  <img
                    src={s.image_url}
                    alt={s.name}
                    className="h-16 w-16 rounded-full border-2 border-ink/10 object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink/10 bg-surface font-display text-xl text-orange-deep transition-transform group-hover:scale-105">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="flex items-center gap-1 text-center text-xs font-semibold leading-tight text-ink">
                  {s.name}
                  {s.instagram && <InstagramIcon className="h-3 w-3 shrink-0 text-ink-muted" />}
                </span>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
