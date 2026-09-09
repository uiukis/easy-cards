import { NextResponse } from "next/server";

// Richer than /api/tcg-search (which feeds the fichário picker): the public
// gallery wants the big art, the illustrator and the flavour text.
const API_BASE = "https://api.pokemontcg.io/v2";

type TcgApiCard = {
  id: string;
  name: string;
  number: string;
  artist?: string;
  flavorText?: string;
  images: { small: string; large: string };
  set: { name: string; series: string; printedTotal: number; releaseDate?: string };
  rarity?: string;
  types?: string[];
  supertype?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetries(url: string, attempts = 4) {
  let lastStatus = 0;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(300 * i);
    const res = await fetch(url);
    if (res.ok) return res;
    lastStatus = res.status;
  }
  throw new Error(`upstream failed (last status ${lastStatus})`);
}

const quote = (v: string) => (/\s/.test(v) ? `"${v}"` : v);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type")?.trim();
  const rarity = searchParams.get("rarity")?.trim();
  const setId = searchParams.get("setId")?.trim();
  const artist = searchParams.get("artist")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const clauses: string[] = [];
  if (q.length >= 2) clauses.push(`name:${encodeURIComponent(q)}*`);
  if (type) clauses.push(`types:${quote(type)}`);
  if (rarity) clauses.push(`rarity:${quote(rarity)}`);
  if (setId) clauses.push(`set.id:${quote(setId)}`);
  if (artist) clauses.push(`artist:${quote(artist)}`);

  // No criteria -> newest cards overall (a plain `q`-less query is what the
  // flaky upstream handles fastest; any broad `q:` clause 500s or times out).
  const isDefault = clauses.length === 0;

  const pageSize = 24;
  const orderBy = setId ? "number" : "-set.releaseDate";
  const qParam = clauses.length ? `q=${clauses.join(" ")}&` : "";

  try {
    const res = await fetchWithRetries(
      `${API_BASE}/cards?${qParam}orderBy=${orderBy}&page=${page}&pageSize=${pageSize}`
    );
    const { data, totalCount } = (await res.json()) as {
      data: TcgApiCard[];
      totalCount: number;
    };

    const results = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      setName: c.set.name,
      series: c.set.series,
      imageSmall: c.images.small,
      imageLarge: c.images.large,
      cardNumber: `${c.number}/${c.set.printedTotal}`,
      rarity: c.rarity ?? null,
      types: c.types?.join(",") ?? null,
      artist: c.artist ?? null,
      flavorText: c.flavorText ?? null,
    }));

    return NextResponse.json({
      results,
      hasMore: page * pageSize < (totalCount ?? 0),
      total: totalCount ?? 0,
      isDefault,
    });
  } catch {
    return NextResponse.json(
      { results: [], hasMore: false, total: 0, error: "upstream_unavailable" },
      { status: 502 }
    );
  }
}
