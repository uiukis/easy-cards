import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CustomerNav } from "@/components/CustomerNav";
import { BinderListClient, type BinderWithPreview } from "./BinderListClient";
import { GuestFichario } from "./GuestFichario";

export default async function FicharioListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
          <GuestFichario />
        </main>
        <Footer />
      </>
    );
  }

  const [{ data: binders }, { data: cards }] = await Promise.all([
    supabase
      .from("binders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("binder_cards")
      .select("binder_id, image_url, position")
      .eq("user_id", user.id)
      .order("position", { ascending: true }),
  ]);

  const bindersWithPreview: BinderWithPreview[] = (binders ?? []).map((b) => {
    const binderCards = (cards ?? []).filter((c) => c.binder_id === b.id);
    return {
      ...b,
      cardCount: binderCards.length,
      previewImages: binderCards.slice(0, 3).map((c) => c.image_url),
    };
  });

  return (
    <main className="bg-halftone min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <CustomerNav />

        <BinderListClient initial={bindersWithPreview} />
      </div>
    </main>
  );
}
