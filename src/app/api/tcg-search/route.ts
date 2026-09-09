import { NextResponse } from "next/server";

// The Pokémon TCG API's own marketing site (pokemontcg.io) now redirects to
// a paid product (Scrydex), but the underlying API + image CDN it left
// behind are still live and free -- just flaky, so we retry a few times.
const API_BASE = "https://api.pokemontcg.io/v2";

type TcgApiCard = {
  id: string;
  name: string;
  number: string;
  images: { small: string };
  set: { name: string; printedTotal: number };
  rarity?: string;
  types?: string[];
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

// Lucene-ish query pieces for the TCG API. Values with spaces need quoting.
function quote(v: string) {
  return /\s/.test(v) ? `"${v}"` : v;
}

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type")?.trim();
  const rarity = searchParams.get("rarity")?.trim();
  const setId = searchParams.get("setId")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const clauses: string[] = [];
  if (q.length >= 2) clauses.push(`name:${encodeURIComponent(q)}*`);
  if (type) clauses.push(`types:${quote(type)}`);
  if (rarity) clauses.push(`rarity:${quote(rarity)}`);
  if (setId) clauses.push(`set.id:${quote(setId)}`);

  // Need at least a name (2+ chars) or one filter to search.
  if (clauses.length === 0) {
    return NextResponse.json({ results: [], hasMore: false });
  }

  const pageSize = 24;
  const orderBy = setId ? "number" : "-set.releaseDate";

  try {
    const res = await fetchWithRetries(
      `${API_BASE}/cards?q=${clauses.join(" ")}&orderBy=${orderBy}&page=${page}&pageSize=${pageSize}`
    );
    const { data, totalCount } = (await res.json()) as {
      data: TcgApiCard[];
      totalCount: number;
    };

    const results = data.map((c) => ({
      id: c.id,
      name: c.name,
      setName: c.set.name,
      imageUrl: c.images.small,
      cardNumber: `${c.number}/${c.set.printedTotal}`,
      rarity: c.rarity ?? null,
      types: c.types?.join(",") ?? null,
    }));

    return NextResponse.json({ results, hasMore: page * pageSize < (totalCount ?? 0) });
  } catch {
    return NextResponse.json({ results: [], hasMore: false, error: "upstream_unavailable" }, { status: 502 });
  }
}
