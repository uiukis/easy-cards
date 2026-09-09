import type { Metadata } from "next";
import { Gavel, CalendarClock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Auction } from "@/lib/supabase/types";
import { SITE } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Leilões — Easy Cards",
  description: "Os leilões da Easy Cards: próximos e o histórico. O lance é por enquete no grupo do WhatsApp.",
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

export default async function LeiloesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auctions")
    .select("*")
    .order("happens_at", { ascending: false, nullsFirst: false });
  const all = (data ?? []) as Auction[];

  const now = new Date().getTime();
  const upcoming = all.filter(
    (a) => !a.result && (!a.happens_at || new Date(a.happens_at).getTime() > now)
  );
  const past = all.filter(
    (a) => a.result || (a.happens_at && new Date(a.happens_at).getTime() <= now)
  );
  const next = upcoming[upcoming.length - 1] ?? null;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="bg-halftone bg-bg">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-16">
            <p className="font-comic text-sm text-orange-deep">★ Leilões</p>
            <h1 className="mt-1 font-display text-4xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-5xl">
              LEILÃO POR ENQUETE,<br />
              <span className="text-orange-deep">DIRETO NO GRUPO.</span>
            </h1>
            <p className="mt-3 max-w-xl text-ink-muted">
              A equipe posta a foto do lote, abre uma enquete com as faixas de preço, e quem vota na
              faixa vencedora leva pra casa. Pagamento por Pix na data combinada.
            </p>

            {next ? (
              <div className="mt-8 overflow-hidden rounded-[2rem] border-2 border-orange-deep bg-surface p-5 sm:p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-deep/10 px-3 py-1 font-comic text-xs tracking-wide text-orange-deep">
                  <Gavel className="h-3.5 w-3.5" /> Próximo leilão
                </span>
                <h2 className="mt-2 font-display text-2xl text-ink">{next.title}</h2>
                {next.happens_at && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
                    <CalendarClock className="h-4 w-4 text-orange-deep" />
                    {fmt(next.happens_at)}
                  </p>
                )}
                {next.note && <p className="mt-1.5 text-sm text-ink-muted">{next.note}</p>}
                <a
                  href={SITE.whatsappGroup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Entrar no grupo pra dar lance
                </a>
              </div>
            ) : (
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Entrar no grupo
              </a>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5 pb-20 pt-10 sm:px-8">
          <h2 className="font-display text-xl tracking-wide text-ink">JÁ ROLOU</h2>
          {past.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              O histórico aparece aqui conforme os leilões acontecem.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {past.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-2 border-border bg-surface p-3.5"
                >
                  {a.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin image
                    <img src={a.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-alt">
                      <Gavel className="h-5 w-5 text-ink-muted" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{a.title}</p>
                    <p className="text-xs text-ink-muted">
                      {a.happens_at ? new Date(a.happens_at).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  {a.result && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-teal">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {a.result}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
