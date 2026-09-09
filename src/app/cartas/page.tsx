import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GaleriaClient } from "./GaleriaClient";

export const metadata: Metadata = {
  title: "Galeria de cartas — Easy Cards",
  description:
    "Explore a base completa de cartas Pokémon TCG: busque por nome, set, tipo e raridade, veja a arte em alta e o ilustrador.",
};

export default async function CartasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let binders: { id: string; name: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("binders")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    binders = data ?? [];
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <GaleriaClient binders={binders} loggedIn={!!user} />
      </main>
      <Footer />
    </>
  );
}
