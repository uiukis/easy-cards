import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const GRID_SIZES: Record<string, { cols: number; rows: number }> = {
  "2x2": { cols: 2, rows: 2 },
  "3x3": { cols: 3, rows: 3 },
  "4x3": { cols: 4, rows: 3 },
  "4x4": { cols: 4, rows: 4 },
  "4x5": { cols: 4, rows: 5 },
  "5x4": { cols: 5, rows: 4 },
};

const COLS_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

const VARIANT_ABBR: Record<string, string> = {
  reverse_holo: "RH",
  holo: "H",
  first_edition: "1ED",
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pageBgStyle(url: string | undefined) {
  if (!url) return undefined;
  return {
    backgroundImage: `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url(${JSON.stringify(
      url
    )})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } as const;
}

export default async function SharedBinderPage({
  params,
}: {
  params: Promise<{ binderId: string }>;
}) {
  const { binderId } = await params;
  const supabase = await createClient();

  const { data: binder } = await supabase
    .from("binders")
    .select("*")
    .eq("id", binderId)
    .eq("share_enabled", true)
    .single();
  if (!binder) notFound();

  const { data: cards } = await supabase
    .from("binder_cards")
    .select("*")
    .eq("binder_id", binderId)
    .order("position", { ascending: true });

  const { cols, rows } = GRID_SIZES[binder.grid_size] ?? GRID_SIZES["3x3"];
  const allCards = cards ?? [];
  const pages = chunk(allCards, cols * rows);
  const pageLabels: Record<string, string> = binder.page_labels ?? {};
  const pageBackgrounds: Record<string, string> = binder.page_backgrounds ?? {};
  const haveCount = allCards.filter((c) => !c.want && !c.is_image).length;
  const wantCount = allCards.filter((c) => c.want && !c.is_image).length;

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <Image src="/brand/icon-square.png" alt="Easy Cards" width={32} height={32} className="rounded-full" />
          <span className="text-comic-shadow-sm font-display text-lg tracking-wide text-orange-deep">
            EASY <span className="text-orange">CARDS</span>
          </span>
        </Link>

        {binder.cover_enabled ? (
          <div className="mt-6 overflow-hidden rounded-[2rem] border-2 border-ink/10 bg-surface">
            <div className="bg-halftone relative flex min-h-[200px] flex-col justify-end overflow-hidden p-6 sm:min-h-[260px] sm:p-8">
              {binder.cover_image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- uploaded cover art */}
                  <img
                    src={binder.cover_image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
                </>
              ) : (
                <div className="bg-sunburst absolute inset-0" />
              )}
              <div className="relative">
                <h1
                  className={`font-display text-3xl tracking-wide text-comic-shadow-sm sm:text-4xl ${
                    binder.cover_image_url ? "text-white" : "text-ink"
                  }`}
                >
                  {binder.name.toUpperCase()}
                </h1>
                {binder.cover_subtitle && (
                  <p
                    className={`mt-1.5 text-sm ${
                      binder.cover_image_url ? "text-white/90" : "text-ink-muted"
                    }`}
                  >
                    {binder.cover_subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 divide-x-2 divide-ink/10 border-t-2 border-ink/10">
              {[
                { label: "Cartas", value: haveCount },
                { label: "Quero", value: wantCount },
                { label: "Imagens", value: allCards.filter((c) => c.is_image).length },
                { label: "Páginas", value: pages.length },
              ].map((c) => (
                <div key={c.label} className="px-2 py-3 text-center">
                  <p className="font-display text-xl text-ink">{c.value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    {c.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl text-ink text-comic-shadow-sm">
              {binder.name.toUpperCase()}
            </h1>
          </div>
        )}
        {binder.description && (
          <p className="mt-2 max-w-xl text-sm text-ink">{binder.description}</p>
        )}
        <p className="mt-1 text-sm text-ink-muted">Fichário compartilhado — só para visualização.</p>

        {allCards.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-halftone py-20 text-center">
            <BookOpen className="h-10 w-10 text-ink-muted" />
            <p className="text-sm text-ink-muted">Esse fichário ainda está vazio.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {pages.map((pc, pi) => (
              <div key={pi}>
                {pageLabels[String(pi)] && (
                  <p className="mb-2 text-center text-xs font-bold text-ink-muted">
                    {pageLabels[String(pi)]}
                  </p>
                )}
                <div
                  style={pageBgStyle(pageBackgrounds[String(pi)])}
                  className={`grid ${COLS_CLASS[cols]} gap-3 rounded-[2rem] border-2 border-ink/10 bg-surface p-4 sm:gap-4 sm:p-8`}
                >
                  {pc.map((card) => (
                    <div
                      key={card.id}
                      style={card.span_cols > 1 ? { gridColumn: `span ${card.span_cols}` } : undefined}
                      className={`relative aspect-[5/7] overflow-hidden rounded-lg border-2 bg-bg shadow-sm ${
                        card.want && !card.is_image
                          ? "border-dashed border-orange/70"
                          : "border-ink/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className={`h-full w-full object-cover ${
                          card.want && !card.is_image ? "opacity-45 saturate-50" : ""
                        }`}
                      />
                      {card.want && !card.is_image && (
                        <span className="absolute left-0 top-2 bg-orange-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          Quero
                        </span>
                      )}
                      {card.variant && VARIANT_ABBR[card.variant] && (
                        <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                          {VARIANT_ABBR[card.variant]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
