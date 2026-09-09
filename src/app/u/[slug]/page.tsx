import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, BadgeCheck, ShieldQuestion } from "lucide-react";
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

type PublicWishlist = {
  name: string | null;
  verified: boolean;
  avatar: string | null;
  pokemon: string | null;
  items: PublicItem[];
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
        {!data.verified && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs text-ink-muted">
            <ShieldQuestion className="h-3.5 w-3.5 shrink-0" />
            Conta ainda não verificada pela Easy Cards — confirme quem é antes de fechar negócio.
          </p>
        )}
        <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
          <Sparkles className="h-4 w-4 text-primary" />
          {data.items.length} {data.items.length === 1 ? "carta procurada" : "cartas procuradas"} — se
          você tem alguma pra trocar ou vender, chama!
        </p>

        <a
          href={SITE.whatsappGroup}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal/20 transition-transform hover:scale-105 active:scale-95"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Falar no grupo da Easy Cards
        </a>

        {data.items.length === 0 ? (
          <p className="mt-10 rounded-2xl border-2 border-dashed border-ink/15 bg-surface/60 p-6 text-center text-sm text-ink-muted">
            {who} ainda não listou nenhuma carta.
          </p>
        ) : (
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
