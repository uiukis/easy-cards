import { redirect } from "next/navigation";
import Link from "next/link";
import { PackageOpen, BookOpen, ArrowRight, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { CustomerNav } from "@/components/CustomerNav";

export default async function MinhasCartasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/minhas-cartas");

  const [{ data: profile }, { data: purchases }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("card_finance")
      .select("*, cards(name, set_name, card_number, image_url, condition)")
      .eq("buyer_id", user.id)
      .order("sold_at", { ascending: false }),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] || "colecionador";
  const total = (purchases ?? []).reduce((sum, p) => sum + (Number(p.final_price) || 0), 0);

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <CustomerNav />

        <p className="font-comic text-sm text-primary">E aí, {firstName}! 👋</p>
        <h1 className="mt-1 font-display text-3xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-4xl">
          MINHAS CARTAS
        </h1>
        <p className="mt-2 text-sm text-ink-muted">Tudo que você já comprou ou arrematou com a gente.</p>

        {purchases && purchases.length > 0 && (
          <div className="mt-5 flex items-center gap-2 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 text-sm font-bold text-ink w-fit">
            <Wallet className="h-4 w-4 text-primary" />
            R$ {total.toFixed(2)} investidos em {purchases.length}{" "}
            {purchases.length === 1 ? "carta" : "cartas"}
          </div>
        )}

        <Link
          href="/fichario"
          className="mt-4 flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
        >
          <BookOpen className="h-4 w-4" />
          Montar meu fichário
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {!purchases || purchases.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[2rem] border-2 border-dashed border-ink/15 bg-surface/60 py-16 text-center">
            <PackageOpen className="h-9 w-9 text-ink-muted" />
            <p className="max-w-xs text-sm text-ink-muted">
              Você ainda não tem nenhuma carta registrada por aqui. Bora dar uma olhada nos leilões
              da semana?
            </p>
            <a
              href={SITE.whatsappGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal/20 transition-transform hover:scale-105 active:scale-95"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Entrar no grupo
            </a>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {purchases.map((p) => {
              const card = p.cards as {
                name: string;
                set_name: string | null;
                card_number: string | null;
                image_url: string | null;
                condition: string | null;
              } | null;
              return (
                <div
                  key={p.id}
                  className="flex gap-3 rounded-2xl border-2 border-ink/10 bg-surface p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  {card?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary card art URLs
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="h-24 w-auto rounded-md object-contain"
                    />
                  ) : (
                    <div className="h-24 w-16 shrink-0 rounded-md bg-surface-alt" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {card?.name ?? "Carta"}
                      {card?.card_number && (
                        <span className="ml-1 font-normal text-ink-muted">({card.card_number})</span>
                      )}
                    </p>
                    {card?.set_name && <p className="text-xs text-ink-muted">{card.set_name}</p>}
                    {p.final_price != null && (
                      <p className="mt-1 font-display text-lg text-primary">
                        R$ {Number(p.final_price).toFixed(2)}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.sold_at && (
                        <Badge variant="secondary">
                          {new Date(p.sold_at).toLocaleDateString("pt-BR")}
                        </Badge>
                      )}
                      {p.delivery_method && (
                        <Badge variant="outline">
                          {p.delivery_method === "dominaria" ? "Dominaria" : "Em mãos"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
