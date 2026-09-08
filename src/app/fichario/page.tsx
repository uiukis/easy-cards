import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/app/admin/LogoutButton";
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
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/icon-square.png" alt="Easy Cards" width={32} height={32} className="rounded-full" />
            <span className="font-display text-base tracking-wide text-ink">EASY CARDS</span>
          </Link>
          <LogoutButton />
        </div>

        <FicharioClient initial={cards ?? []} />
      </div>
    </main>
  );
}
