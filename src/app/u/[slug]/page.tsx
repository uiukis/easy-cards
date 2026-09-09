import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, BadgeCheck, ShieldQuestion, BookOpen, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";
import { PokemonAvatar } from "@/components/PokemonAvatar";

type PublicItem = {
  id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string;
  rarity: string | null;
  priority: number;
  note: string | null;
};

type PublicTrade = {
  id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string;
  condition: string | null;
  note: string | null;
};

type PublicWishlist = {
  id: string;
  name: string | null;
  username: string | null;
  verified: boolean;
  email_confirmed: boolean;
  avatar: string | null;
  pokemon: string | null;
  member_since: string | null;
  items: PublicItem[];
  trades: PublicTrade[];
};

type PublicBinder = {
  id: string;
  name: string;
  cover_image_url: string | null;
  have: number;
  want: number;
  set_total: number | null;
};

const PRIORITY_LABEL: Record<number, string> = {
  1: "Quero muito",
  2: "Quero",
  3: "De olho",
};

async function load(slug: string): Promise<PublicWishlist | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_wishlist", { p_slug: slug });
  if (error || !data) return null;
  return data as PublicWishlist;
}

async function loadBinders(userId: string): Promise<PublicBinder[]> {
  const supabase = await createClient();
  const { data: binders } = await supabase
    .from("binders")
    .select("id, name, cover_image_url, set_total")
    .eq("user_id", userId)
    .eq("share_enabled", true)
    .order("created_at", { ascending: false });
  if (!binders || binders.length === 0) return [];

  const ids = binders.map((b) => b.id);
  const { data: cards } = await supabase
    .from("binder_cards")
    .select("binder_id, want, is_image")
    .in("binder_id", ids);

  return binders.map((b) => {
    const rows = (cards ?? []).filter((c) => c.binder_id === b.id && !c.is_image);
    return {
      id: b.id,
      name: b.name,
      cover_image_url: b.cover_image_url,
      set_total: b.set_total,
      have: rows.filter((c) => !c.want).length,
      want: rows.filter((c) => c.want).length,
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Lista de desejo" };
  const who = data.name ?? "Colecionador";
  return {
    title: `Lista de desejo de ${who} · Easy Cards`,
    description: `${data.items.length} carta(s) que ${who} tá procurando.`,
  };
}

export default async function PublicWishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const binders = await loadBinders(data.id);
  const totalHave = binders.reduce((s, b) => s + b.have, 0);

  const who = data.name ?? "Colecionador";
  const groups = [1, 2, 3]
    .map((p) => ({ p, items: data.items.filter((i) => i.priority === p) }))
    .filter((g) => g.items.length > 0);

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <Image
            src="/brand/icon-square.png"
            alt="Easy Cards"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="text-comic-shadow-sm font-display text-lg tracking-wide text-orange-deep">
            EASY <span className="text-orange">CARDS</span>
          </span>
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <PokemonAvatar sprite={data.avatar} name={who} size={52} />
          <div>
            <p className="font-comic text-sm text-primary">Lista de desejo</p>
            <h1 className="flex items-center gap-1.5 font-display text-2xl text-ink text-comic-shadow-sm sm:text-3xl">
              {who.toUpperCase()}
              {data.verified && <BadgeCheck className="h-5 w-5 text-teal" aria-label="Verificado" />}
            </h1>
          </div>
        </div>
        {data.username && (
          <p className="mt-1 font-mono text-xs text-ink-muted">@{data.username}</p>
        )}
        {!data.verified && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs text-ink-muted">
            <ShieldQuestion className="h-3.5 w-3.5 shrink-0" />
            {data.email_confirmed
              ? "Contato confirmado, mas a Easy Cards ainda não verificou a identidade — confirme quem é antes de fechar negócio."
              : "Conta ainda não verificada pela Easy Cards — confirme quem é antes de fechar negócio."}
          </p>
        )}
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
          <Sparkles className="h-4 w-4 text-primary" />
          {data.items.length} {data.items.length === 1 ? "carta procurada" : "cartas procuradas"} — se
          você tem alguma pra trocar ou vender, chama!
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[
            binders.length > 0 && [`${binders.length}`, binders.length === 1 ? "fichário" : "fichários"],
            totalHave > 0 && [`${totalHave}`, "cartas organizadas"],
            data.trades.length > 0 && [`${data.trades.length}`, "pra troca"],
            data.member_since && [
              new Date(data.member_since).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
              "desde",
            ],
          ]
            .filter(Boolean)
            .map((s) => {
              const [v, label] = s as [string, string];
              return (
                <span
                  key={label}
                  className="rounded-full border-2 border-ink/10 bg-surface px-3 py-1 font-semibold text-ink"
                >
                  {v} <span className="font-normal text-ink-muted">{label}</span>
                </span>
              );
            })}
        </div>

        <a
          href={SITE.whatsappGroup}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal/20 transition-transform hover:scale-105 active:scale-95"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Falar no grupo da Easy Cards
        </a>

        {data.items.length === 0 && data.trades.length === 0 && binders.length === 0 ? (
          <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/15 bg-surface/60 p-6 text-center text-sm text-ink-muted">
            {who} ainda não listou nenhuma carta.
          </p>
        ) : data.items.length === 0 ? null : (
          <div className="mt-8 space-y-7">
            {groups.map((g) => (
              <div key={g.p}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-orange-deep">
                  {PRIORITY_LABEL[g.p]} · {g.items.length}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {g.items.map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="aspect-[5/7] w-full object-cover"
                      />
                      <div className="p-2.5">
                        <p className="truncate text-xs font-semibold text-ink">
                          {item.name}
                          {item.card_number && (
                            <span className="ml-1 font-normal text-ink-muted">{item.card_number}</span>
                          )}
                        </p>
                        {item.set_name && (
                          <p className="truncate text-[11px] text-ink-muted">{item.set_name}</p>
                        )}
                        {item.note && (
                          <p className="mt-1 text-[11px] text-ink-muted">“{item.note}”</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {data.trades.length > 0 && (
          <div className="mt-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal">
              Tenho pra troca · {data.trades.length}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.trades.map((t) => (
                <div
                  key={t.id}
                  className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external card art URLs */}
                  <img src={t.image_url} alt={t.name} className="aspect-[5/7] w-full object-cover" />
                  <div className="p-2.5">
                    <p className="truncate text-xs font-semibold text-ink">
                      {t.name}
                      {t.card_number && (
                        <span className="ml-1 font-normal text-ink-muted">{t.card_number}</span>
                      )}
                    </p>
                    {t.set_name && (
                      <p className="truncate text-[11px] text-ink-muted">{t.set_name}</p>
                    )}
                    {t.condition && (
                      <p className="text-[11px] text-ink-muted">{t.condition}</p>
                    )}
                    {t.note && <p className="mt-1 text-[11px] text-ink-muted">“{t.note}”</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {binders.length > 0 && (
          <div className="mt-10">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-deep">
              <BookOpen className="h-3.5 w-3.5" />
              Fichários públicos · {binders.length}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {binders.map((b) => {
                const pct =
                  b.set_total && b.set_total > 0
                    ? Math.min(100, Math.round((b.have / b.set_total) * 100))
                    : null;
                return (
                  <Link
                    key={b.id}
                    href={`/b/${b.id}`}
                    className="flex gap-3 overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface p-3 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {b.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- user cover URL
                      <img
                        src={b.cover_image_url}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-ink-muted">
                        <Layers className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{b.name}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {b.set_total
                          ? `${b.have}/${b.set_total} do set${pct !== null ? ` · ${pct}%` : ""}`
                          : `${b.have} ${b.have === 1 ? "carta" : "cartas"}`}
                        {b.want > 0 && ` · ${b.want} na procura`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-ink-muted">
          Monte a sua também —{" "}
          <Link href="/lista-de-desejos" className="font-semibold text-primary hover:underline">
            lista de desejo na Easy Cards
          </Link>
        </p>
      </div>
    </main>
  );
}
