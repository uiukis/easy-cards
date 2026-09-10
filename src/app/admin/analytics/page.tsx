import { redirect } from "next/navigation";
import { Users, Eye, Globe, Link2, Smartphone, Cpu, AppWindow, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";
import { getAnalyticsDashboard } from "@/lib/vercel-analytics";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { DailyChart } from "./DailyChart";
import { BreakdownCard } from "./BreakdownCard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/analytics");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/");

  const permissions = await getEffectivePermissions(supabase, user.id, profile.role);
  if (!permissions.view_analytics) redirect("/admin");

  const { summary, daily, topPages, referrers, countries, devices, os, browsers } =
    await getAnalyticsDashboard();

  return (
    <div>
      <AdminPageHeader
        title="ANALYTICS"
        subtitle="Visitas do site direto do Vercel Web Analytics."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}
