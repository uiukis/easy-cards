import type { Metadata } from "next";
import { Users, Eye, Globe, Link2, Smartphone, Cpu, AppWindow, FileText } from "lucide-react";
import { getAnalyticsDashboard } from "@/lib/vercel-analytics";
import { DailyChart } from "./DailyChart";
import { BreakdownCard } from "./BreakdownCard";

export const metadata: Metadata = {
  title: "Analytics — Easy Cards",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { summary, daily, topPages, referrers, countries, devices, os, browsers } =
    await getAnalyticsDashboard();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">
        ANALYTICS DA EASY CARDS
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Dados de visitas direto do Vercel Web Analytics — sem precisar abrir o painel da Vercel.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border-2 border-ink/10 bg-surface p-6">
            <p className="text-sm font-semibold text-ink-muted">{s.label}</p>
            <div className="mt-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-deep" />
              <span className="font-display text-3xl text-orange-deep">{s.visitors}</span>
              <span className="text-xs text-ink-muted">visitantes</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Eye className="h-4 w-4 text-ink-muted" />
              <span className="font-display text-xl text-ink">{s.pageviews}</span>
              <span className="text-xs text-ink-muted">visualizações</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <DailyChart points={daily} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BreakdownCard title="Páginas mais acessadas" icon={FileText} rows={topPages} />
        <BreakdownCard title="Origem do tráfego" icon={Link2} rows={referrers} />
        <BreakdownCard title="Países" icon={Globe} rows={countries} />
        <BreakdownCard title="Dispositivos" icon={Smartphone} rows={devices} />
        <BreakdownCard title="Sistema operacional" icon={Cpu} rows={os} />
        <BreakdownCard title="Navegadores" icon={AppWindow} rows={browsers} />
      </div>

      <p className="mt-8 text-xs text-ink-muted">
        Essa página (/analytics) não aparece em nenhum menu do site — só quem tem o link chega aqui.
      </p>
    </main>
  );
}
