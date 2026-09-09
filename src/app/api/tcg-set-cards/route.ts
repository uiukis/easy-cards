import { NextResponse } from "next/server";

const API_BASE = "https://api.pokemontcg.io/v2";
const MAX_CARDS = 300;

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

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const setId = searchParams.get("setId")?.trim();
  if (!setId) {
    return NextResponse.json({ error: "missing setId" }, { status: 400 });
  }

  try {
    const res = await fetchWithRetries(
      `${API_BASE}/cards?q=set.id:${encodeURIComponent(setId)}&orderBy=number&pageSize=${MAX_CARDS}`
    );
    const { data } = (await res.json()) as { data: TcgApiCard[] };

    const cards = data.map((c) => ({
      id: c.id,
      name: c.name,
      setName: c.set.name,
      imageUrl: c.images.small,
      cardNumber: `${c.number}/${c.set.printedTotal}`,
      rarity: c.rarity ?? null,
      types: c.types?.join(",") ?? null,
    }));

    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ cards: [], error: "upstream_unavailable" }, { status: 502 });
  }
}
