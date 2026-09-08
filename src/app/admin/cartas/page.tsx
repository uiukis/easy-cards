import { createClient } from "@/lib/supabase/server";
import { CartasClient } from "./CartasClient";

export default async function CartasPage() {
  const supabase = await createClient();
  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  return <CartasClient initialCards={cards ?? []} />;
}
