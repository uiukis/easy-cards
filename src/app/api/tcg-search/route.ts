import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  // Staff-only: this proxies a third-party API using our server, so it
  // shouldn't be an open relay for anyone on the internet.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Newest sets first -- staff are almost always cataloging a recent
    // release, not a decade-old reprint, and a plain name search buries
    // new cards behind years of reprints of common Pokémon.
    const res = await fetchWithRetries(
      `${API_BASE}/cards?q=name:${encodeURIComponent(q)}*&orderBy=-set.releaseDate&pageSize=8`
    );
    const { data } = (await res.json()) as { data: TcgApiCard[] };

    const results = data.map((c) => ({
      id: c.id,
      name: c.name,
      setName: c.set.name,
      imageUrl: c.images.small,
      cardNumber: `${c.number}/${c.set.printedTotal}`,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "upstream_unavailable" }, { status: 502 });
  }
}
