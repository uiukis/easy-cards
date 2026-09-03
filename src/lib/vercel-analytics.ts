const BASE_URL = "https://vercel.com/api/v1/query/web-analytics";

function authHeaders() {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  if (!token) throw new Error("VERCEL_ANALYTICS_TOKEN is not configured.");
  return { Authorization: `Bearer ${token}` };
}

function baseParams() {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!projectId || !teamId) {
    throw new Error("VERCEL_PROJECT_ID / VERCEL_TEAM_ID are not configured.");
  }
  return { projectId, teamId };
}

async function query(path: string, params: Record<string, string>) {
  const url = `${BASE_URL}/${path}?${new URLSearchParams({ ...baseParams(), ...params }).toString()}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Vercel analytics request failed (${path}): ${res.status}`);
  }
  return res.json();
}

export type PeriodStats = { label: string; visitors: number; pageviews: number };

const SUMMARY_PERIODS = [
  { label: "Hoje", days: 1 },
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
];

// The visits/count endpoint floors `until` to the start of its UTC day, so
// passing "now" silently excludes today's data. Using the start of tomorrow
// as `until` keeps the current day inside the range.
function tomorrowUTC(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getSummary(): Promise<PeriodStats[]> {
  const until = tomorrowUTC();
  const results = await Promise.all(
    SUMMARY_PERIODS.map((p) => {
      const since = new Date(until.getTime() - p.days * 24 * 60 * 60 * 1000);
      return query("visits/count", {
        since: since.toISOString(),
        until: until.toISOString(),
      });
    })
  );
  return SUMMARY_PERIODS.map((p, i) => ({
    label: p.label,
    visitors: results[i].data?.visitors ?? 0,
    pageviews: results[i].data?.pageviews ?? 0,
  }));
}

export type DailyPoint = { date: string; visitors: number; pageviews: number };

export async function getDailySeries(days = 30): Promise<DailyPoint[]> {
  const until = tomorrowUTC();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  const res = await query("visits/aggregate", {
    since: since.toISOString(),
    until: until.toISOString(),
    by: "day",
    limit: "100",
  });

  const rows: Record<string, unknown>[] = res.data ?? [];
  const byDate = new Map<string, DailyPoint>();
  for (const row of rows) {
    const raw = (row.timestamp ?? row.date) as string | undefined;
    if (!raw) continue;
    const date = raw.slice(0, 10);
    const visitors = Number(row.visitors ?? 0);
    const pageviews = Number(row.pageviews ?? 0);
    const existing = byDate.get(date);
    if (existing) {
      existing.visitors += visitors;
      existing.pageviews += pageviews;
    } else {
      byDate.set(date, { date, visitors, pageviews });
    }
  }

  const points: DailyPoint[] = [];
  for (let i = days; i >= 1; i--) {
    const d = new Date(until.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    points.push(byDate.get(key) ?? { date: key, visitors: 0, pageviews: 0 });
  }
  return points;
}

export type BreakdownRow = { label: string; visitors: number; pageviews: number };

const DIMENSION_FALLBACK: Record<string, string> = {
  requestPath: "/",
  referrerHostname: "Acesso direto",
  country: "Desconhecido",
  deviceType: "Desconhecido",
  osName: "Desconhecido",
  browserName: "Desconhecido",
};

export async function getBreakdown(
  dimension: keyof typeof DIMENSION_FALLBACK,
  days = 30,
  limit = 6
): Promise<BreakdownRow[]> {
  const until = tomorrowUTC();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  const res = await query("visits/aggregate", {
    since: since.toISOString(),
    until: until.toISOString(),
    by: dimension,
    limit: String(limit),
  });

  const rows: Record<string, unknown>[] = res.data ?? [];
  return rows
    .map((row) => ({
      label: (row[dimension] as string) || DIMENSION_FALLBACK[dimension],
      visitors: Number(row.visitors ?? 0),
      pageviews: Number(row.pageviews ?? 0),
    }))
    .sort((a, b) => b.pageviews - a.pageviews);
}

export type AnalyticsDashboard = {
  summary: PeriodStats[];
  daily: DailyPoint[];
  topPages: BreakdownRow[];
  referrers: BreakdownRow[];
  countries: BreakdownRow[];
  devices: BreakdownRow[];
  os: BreakdownRow[];
  browsers: BreakdownRow[];
};

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const [summary, daily, topPages, referrers, countries, devices, os, browsers] =
    await Promise.all([
      getSummary(),
      getDailySeries(30),
      getBreakdown("requestPath", 30, 8),
      getBreakdown("referrerHostname", 30, 6),
      getBreakdown("country", 30, 6),
      getBreakdown("deviceType", 30, 6),
      getBreakdown("osName", 30, 6),
      getBreakdown("browserName", 30, 6),
    ]);

  return { summary, daily, topPages, referrers, countries, devices, os, browsers };
}
