import type { DailyPoint } from "@/lib/vercel-analytics";

const WEEKDAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function formatDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export function DailyChart({ points }: { points: DailyPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.pageviews));

  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg tracking-wide text-ink">
          VISUALIZAÇÕES POR DIA
        </h2>
        <span className="text-xs font-semibold text-ink-muted">
          últimos {points.length} dias
        </span>
      </div>

      <div className="mt-6 flex h-40 items-end gap-1 sm:gap-1.5">
        {points.map((p) => {
          const heightPct = Math.max(2, (p.pageviews / max) * 100);
          const d = new Date(`${p.date}T00:00:00Z`);
          return (
            <div
              key={p.date}
              className="group relative flex-1"
              title={`${WEEKDAY[d.getUTCDay()]} ${formatDay(p.date)} · ${p.pageviews} visualizações · ${p.visitors} visitantes`}
            >
              <div
                className="w-full rounded-t-sm bg-orange-deep/70 transition-colors group-hover:bg-orange-deep"
                style={{ height: `${heightPct}%`, minHeight: 2 }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-semibold text-ink-muted">
        <span>{formatDay(points[0]?.date ?? "")}</span>
        <span>{formatDay(points[points.length - 1]?.date ?? "")}</span>
      </div>
    </div>
  );
}
