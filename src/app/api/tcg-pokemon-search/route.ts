import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_BASE = "https://api.pokemontcg.io/v2";
const MAX_CARDS = 250;

type TcgApiCard = {
  id: string;
  name: string;
  number: string;
  images: { small: string };
  set: { name: string; printedTotal: number };
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ totalCount: 0, groups: [], cards: [] });
  }

  try {
    const res = await fetchWithRetries(
      `${API_BASE}/cards?q=name:${encodeURIComponent(name)}*&orderBy=name,-set.releaseDate&pageSize=${MAX_CARDS}`
    );
    const { data, totalCount } = (await res.json()) as {
      data: TcgApiCard[];
      totalCount: number;
    };

    const cards = data.map((c) => ({
      id: c.id,
      name: c.name,
      setName: c.set.name,
      imageUrl: c.images.small,
      cardNumber: `${c.number}/${c.set.printedTotal}`,
    }));

    const groupCounts = new Map<string, number>();
    for (const c of cards) {
      groupCounts.set(c.name, (groupCounts.get(c.name) ?? 0) + 1);
    }
    const groups = Array.from(groupCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ totalCount, groups, cards });
  } catch {
    return NextResponse.json(
      { totalCount: 0, groups: [], cards: [], error: "upstream_unavailable" },
      { status: 502 }
    );
  }
}
