import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerNav } from "@/components/CustomerNav";
import { BinderClient } from "./BinderClient";

export default async function BinderPage({
  params,
}: {
  params: Promise<{ binderId: string }>;
}) {
  const { binderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/fichario/${binderId}`);

  const { data: binder } = await supabase
    .from("binders")
    .select("*")
    .eq("id", binderId)
    .eq("user_id", user.id)
    .single();
  if (!binder) notFound();

  const { data: cards } = await supabase
    .from("binder_cards")
    .select("*")
    .eq("binder_id", binderId)
    .order("position", { ascending: true });

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <CustomerNav />

        <BinderClient binder={binder} initial={cards ?? []} />
      </div>
    </main>
  );
}
