import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDatePt } from "@/lib/format";
import { ApoiadorContent } from "./ApoiadorContent";

export const metadata: Metadata = {
  title: "Seja um apoiador — Easy Cards",
  description:
    "Aproxime sua loja da comunidade Pokémon TCG. Veja como funciona ser apoiador da Easy Cards: eventos presenciais, leilões e divulgação pra quem já ama o hobby.",
};

export default async function ApoiadorPage() {
  const supabase = await createClient();
  const [{ data: supporters }, { data: eventSettings }] = await Promise.all([
    supabase.from("supporters").select("*").eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("event_settings").select("event_date, place").single(),
  ]);

  return (
    <ApoiadorContent
      supporters={supporters ?? []}
      eventDate={eventSettings?.event_date ? formatDatePt(eventSettings.event_date) : undefined}
      eventPlace={eventSettings?.place ?? undefined}
    />
  );
}
