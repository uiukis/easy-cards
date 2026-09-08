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

  const { cols } = GRID_SIZES[binder.grid_size] ?? GRID_SIZES["3x3"];

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <Image src="/brand/icon-square.png" alt="Easy Cards" width={32} height={32} className="rounded-full" />
          <span className="text-comic-shadow-sm font-display text-lg tracking-wide text-orange-deep">
            EASY <span className="text-orange">CARDS</span>
          </span>
        </Link>

        <div className="mt-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl text-ink text-comic-shadow-sm">
            {binder.name.toUpperCase()}
          </h1>
        </div>
        {binder.description && (
          <p className="mt-1 max-w-xl text-sm text-ink">{binder.description}</p>
        )}
        <p className="mt-1 text-sm text-ink-muted">Fichário compartilhado — só para visualização.</p>

        {!cards || cards.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-halftone py-20 text-center">
            <BookOpen className="h-10 w-10 text-ink-muted" />
            <p className="text-sm text-ink-muted">Esse fichário ainda está vazio.</p>
          </div>
        ) : (
          <div
            className={`mt-8 grid ${COLS_CLASS[cols]} gap-3 rounded-[2rem] border-2 border-ink/10 bg-surface p-4 sm:gap-4 sm:p-8`}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                style={card.span_cols > 1 ? { gridColumn: `span ${card.span_cols}` } : undefined}
                className="relative aspect-[5/7] overflow-hidden rounded-lg border-2 border-ink/10 bg-bg shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
                {card.variant && VARIANT_ABBR[card.variant] && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                    {VARIANT_ABBR[card.variant]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
