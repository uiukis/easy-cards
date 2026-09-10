import type { LucideIcon } from "lucide-react";
import type { BreakdownRow } from "@/lib/vercel-analytics";

export function BreakdownCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: LucideIcon;
  rows: BreakdownRow[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.pageviews));

  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-surface p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-orange-deep" />
        <h2 className="font-display text-sm tracking-wide text-ink">
          {title.toUpperCase()}
        </h2>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Sem dados ainda.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-ink" title={row.label}>
                  {row.label}
                </span>
                <span className="shrink-0 font-semibold text-ink-muted">
                  {row.pageviews}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                <div
                  className="h-full rounded-full bg-orange-deep/70"
                  style={{ width: `${Math.max(4, (row.pageviews / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
