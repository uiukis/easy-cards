import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Card } from "@/lib/supabase/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LojaClient } from "./LojaClient";

export const metadata: Metadata = {
  title: "Loja — Easy Cards",
  description: "Cartas Pokémon à venda na Easy Cards.",
};

export default async function LojaPage() {
  const supabase = await createClient();

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "shop_enabled")
    .maybeSingle();

  if (setting?.value !== true) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, name, set_name, card_number, image_url, condition, description, price, status")
    .eq("in_stock", true)
    .order("created_at", { ascending: false });

  const available = (cards ?? []).filter((c) => c.status !== "sold") as Pick<
    Card,
    "id" | "name" | "set_name" | "card_number" | "image_url" | "condition" | "description" | "price" | "status"
  >[];

  return (
    <>
      <Navbar />
      <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
        <LojaClient cards={available} />
      </main>
      <Footer />
    </>
  );
}
