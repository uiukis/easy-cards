import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ApoiadorContent } from "./ApoiadorContent";

export const metadata: Metadata = {
  title: "Seja um apoiador — Easy Cards",
  description:
    "Aproxime sua loja da comunidade Pokémon TCG. Veja como funciona ser apoiador da Easy Cards: eventos presenciais, leilões e divulgação pra quem já ama o hobby.",
};

export default async function ApoiadorPage() {
  const supabase = await createClient();
  const { data: supporters } = await supabase
    .from("supporters")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return <ApoiadorContent supporters={supporters ?? []} />;
}
