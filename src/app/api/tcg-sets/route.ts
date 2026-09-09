import { NextResponse } from "next/server";

const API_BASE = "https://api.pokemontcg.io/v2";

type TcgApiSet = {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  releaseDate: string;
  images: { symbol: string; logo: string };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetries(url: string, attempts = 4) {
  let lastStatus = 0;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(300 * i);
    const res = await fetch(url);
    if (res.ok) return res;
    lastStatus = res.status;
  }
  throw new Error(`upstream failed after ${attempts} attempts (last status ${lastStatus})`);
}

export async function GET() {

  try {
    const res = await fetchWithRetries(`${API_BASE}/sets?orderBy=-releaseDate&pageSize=250`);
    const { data } = (await res.json()) as { data: TcgApiSet[] };

    const sets = data.map((s) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      printedTotal: s.printedTotal,
      releaseDate: s.releaseDate,
      symbolUrl: s.images.symbol,
    }));

    return NextResponse.json({ sets });
  } catch {
    return NextResponse.json({ sets: [], error: "upstream_unavailable" }, { status: 502 });
  }
}
