import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PressCard } from "@/components/PressSection";

export const metadata: Metadata = {
  title: "Imprensa — Easy Cards",
  description: "Matérias e coberturas sobre a Easy Cards na imprensa.",
};

export default async function ImprensaPage() {
  const supabase = await createClient();
  const { data: mentions } = await supabase
    .from("press_mentions")
    .select("*")
    .eq("active", true)
    .order("published_date", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="flex-1 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Newspaper className="mx-auto h-8 w-8 text-orange-deep" />
            <h1 className="mt-4 font-display text-4xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-5xl">
              IMPRENSA
            </h1>
            <p className="mt-3 text-ink-muted">Matérias e coberturas sobre a Easy Cards.</p>
          </div>

          {!mentions || mentions.length === 0 ? (
            <p className="mt-12 text-center text-sm text-ink-muted">Nenhuma matéria publicada ainda.</p>
          ) : (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mentions.map((m) => (
                <PressCard key={m.id} mention={m} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
