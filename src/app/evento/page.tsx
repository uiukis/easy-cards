import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EventoContent } from "./EventoContent";

export const metadata: Metadata = {
  title: "Oficina Pokémon TCG — 19 de setembro no RioMar Kennedy | Easy Cards",
  description:
    "Primeiro evento presencial da Easy Cards: uma tarde educativa para aprender a jogar Pokémon TCG do zero, no Shopping RioMar Kennedy, em Fortaleza.",
};

export default async function EventoPage() {
  const supabase = await createClient();
  const { data: eventSettings } = await supabase.from("event_settings").select("*").single();

  return <EventoContent eventSettings={eventSettings} />;
}
