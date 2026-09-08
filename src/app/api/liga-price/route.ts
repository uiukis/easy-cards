import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Liga Pokémon blocks non-Brazilian IPs at the Cloudflare level (works
// fine from a BR IP, returns nothing from anywhere else) -- see
// vercel.json, which pins this whole project to the São Paulo region.

// Liga Pokémon doesn't have a public API, so this scrapes their card
// detail page (?view=cards/card&card=<Name>) -- it's server-rendered
// HTML with no JS required, listing every printing of a card with its
// min/avg/max market price. Cached in-memory since it's a courtesy
// lookup, not something we want to hammer their site with on every
// page view.
const BASE_URL = "https://www.ligapokemon.com.br/";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h -- prices don't move minute to minute
const cache = new Map<string, { at: number; data: LigaPrintingPrice[] }>();

type LigaPrintingPrice = {
  setName: string;
  cardNumber: string;
  priceMin: number;
  priceAvg: number;
  priceMax: number;
  url: string;
};

function toLigaName(name: string) {
  // The TCG API gives us "Charizard VMAX"; Liga Pokémon's single-card
  // pages use a hyphen before the suffix: "Charizard-VMAX".
  return name.trim().replace(/\s+(VMAX|VSTAR|GX|EX|ex|V)$/, "-$1");
}

function parseBrPrice(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

function parsePrintings(html: string): LigaPrintingPrice[] {
  const blocks = html.split('<div class="mtg-single">').slice(1);
  const results: LigaPrintingPrice[] = [];

  for (const block of blocks) {
    const setMatch = block.match(/title="([^"]+)"\s+alt=""/);
    const numberMatch = block.match(/class="mtg-numeric-code">\(([^)]+)\)/);
    const minMatch = block.match(/price-min">R\$ ([\d.,]+)/);
    const avgMatch = block.match(/price-avg">R\$ ([\d.,]+)/);
    const maxMatch = block.match(/price-max">R\$ ([\d.,]+)/);
    const urlMatch = block.match(/href="([^"]+)"\s+class="main-link-card"/);

    if (!avgMatch || !minMatch || !maxMatch) continue;

    const priceAvg = parseBrPrice(avgMatch[1]);
    if (priceAvg <= 0) continue;

    results.push({
      setName: setMatch?.[1] ?? "",
      cardNumber: numberMatch?.[1] ?? "",
      priceMin: parseBrPrice(minMatch[1]),
      priceAvg,
      priceMax: parseBrPrice(maxMatch[1]),
      url: urlMatch ? new URL(urlMatch[1], BASE_URL).toString() : BASE_URL,
    });
  }

  return results;
}

async function fetchPrintings(name: string): Promise<LigaPrintingPrice[]> {
  const cached = cache.get(name);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const url = `${BASE_URL}?view=cards/card&card=${encodeURIComponent(toLigaName(name))}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`liga pokemon returned ${res.status}`);
  const html = await res.text();
  const data = parsePrintings(html);
  cache.set(name, { at: Date.now(), data });
  return data;
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
  const number = searchParams.get("number")?.trim(); // e.g. "20/189"
  if (!name) {
    return NextResponse.json({ error: "missing name" }, { status: 400 });
  }

  try {
    const printings = await fetchPrintings(name);
    if (printings.length === 0) {
      return NextResponse.json({ found: false });
    }

    const cardNum = number?.split("/")[0]?.replace(/^0+/, "");
    const exact = cardNum
      ? printings.find((p) => p.cardNumber.split("/")[0]?.replace(/^0+/, "") === cardNum)
      : undefined;
    const match = exact ?? printings.reduce((a, b) => (a.priceAvg <= b.priceAvg ? a : b));

    return NextResponse.json({ found: true, exact: Boolean(exact), price: match });
  } catch {
    return NextResponse.json({ found: false, error: "upstream_unavailable" }, { status: 502 });
  }
}
