import { CreditCard, Gavel, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: available }, { count: inAuction }, { count: sold }] = await Promise.all([
    supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "in_auction"),
    supabase.from("cards").select("*", { count: "exact", head: true }).eq("status", "sold"),
  ]);

  const cards = [
    { label: "Disponíveis", value: available ?? 0, icon: CreditCard },
    { label: "Em leilão", value: inAuction ?? 0, icon: Gavel },
    { label: "Vendidas", value: sold ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">PAINEL</h1>
      <p className="mt-1 text-sm text-ink-muted">Resumo do catálogo de cartas.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border-2 border-ink/10 bg-surface p-6">
            <c.icon className="h-5 w-5 text-orange-deep" />
            <p className="mt-3 font-display text-3xl text-ink">{c.value}</p>
            <p className="text-sm text-ink-muted">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
