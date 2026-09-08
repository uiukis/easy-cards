import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerNav } from "@/components/CustomerNav";
import { FicharioClient } from "./FicharioClient";

export default async function FicharioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/fichario");

  const { data: cards } = await supabase
    .from("binder_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  return (
    <main className="min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <CustomerNav />

        <FicharioClient initial={cards ?? []} />
      </div>
    </main>
  );
}
