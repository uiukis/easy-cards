"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-alt hover:text-orange-deep"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  );
}
