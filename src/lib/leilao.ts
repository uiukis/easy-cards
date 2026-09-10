// Pure helpers for the "importar leilão" flow. Parsing + TCG matching run in
// the browser (the server action would blow its time budget on ~90 flaky API
// calls); only the final DB write is a server action.

export type ParsedRow = {
  raw: string;
  buyer: string;
  cardText: string;
  name: string;
  /** "025/078" style, or "" */
  number: string;
  printedTotal: number | null;
  price: number | null;
  free: boolean;
  paymentStatus: "aberto" | "parcial" | "pago";
  notes: string;
};

export type CardMatch = {
  tcg_api_id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string;
  rarity: string | null;
};

export type MatchedRow = ParsedRow & { match: CardMatch | null; ambiguous: boolean };

function splitCells(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((s) => s.trim());
  if (line.includes("|")) return line.split("|").map((s) => s.trim());
  if (line.includes(";")) return line.split(";").map((s) => s.trim());
  return line.split(/\s{2,}/).map((s) => s.trim());
}

function parsePrice(cell: string): { price: number | null; free: boolean } {
  const c = cell.toLowerCase().trim();
  if (!c) return { price: null, free: false };
  if (/gratu|gr[aá]tis|free|brinde/.test(c)) return { price: 0, free: true };
  const m = c.replace(/r\$\s*/g, "").replace(/\./g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return { price: null, free: false };
  return { price: Number(m[0]), free: false };
}

function parseStatus(cell: string): "aberto" | "parcial" | "pago" {
  const c = cell.toLowerCase().trim();
  if (!c) return "aberto";
  if (c === "x" || /efetu|pago|quitad/.test(c)) return "pago";
  if (/parcial/.test(c)) return "parcial";
  return "aberto";
}

/** Nudge common PT-BR spellings toward the English TCG API names. */
function normName(raw: string) {
  return raw
    .replace(/\bradiante\b/gi, "Radiant")
    .replace(/\bvoador\b/gi, "Flying")
    .replace(/\bbrilhante\b/gi, "Shining")
    .replace(/\bfull art\b/gi, "")
    .trim();
}

function parseCard(text: string) {
  const t = text.trim();
  const m = t.match(/^(.*?)[\s]+([A-Za-z]{0,3}\d{1,4})\s*\/\s*(\d{1,4})\s*$/);
  if (m) return { name: normName(m[1]), number: `${m[2]}/${m[3]}`, printedTotal: Number(m[3]) };
  const m2 = t.match(/^(.*?)[\s]+(\d{1,4})\s*\/\s*-\s*$/);
  if (m2) return { name: normName(m2[1]), number: `${m2[2]}/-`, printedTotal: null };
  const m3 = t.match(/^(.*?)[\s]+n[o°.]\s*\.?\s*(\d{1,4})\s*$/i);
  if (m3) return { name: normName(m3[1]), number: m3[2], printedTotal: null };
  return { name: normName(t), number: "", printedTotal: null };
}

export function parseLeilaoRows(text: string): ParsedRow[] {
  const out: ParsedRow[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(nome|comprador|carta|lista de cartas|leil[aã]o|vendas|faturamento)\b/i.test(line)) continue;
    if (/^dia\s+\d/i.test(line)) continue;

    const cells = splitCells(line).map((c) => c.trim());
    if (cells.filter(Boolean).length < 2) continue;

    const looksPrice = (c: string) =>
      /gratu|gr[aá]tis|free|brinde/i.test(c) || /^r?\$?\d[\d.,]*$/i.test(c.replace(/\s/g, ""));
    const looksStatus = (c: string) =>
      /^(x|aberto|parcial|efetuad[oa]|pago|quitad[oa])$/i.test(c.trim());
    const looksCard = (c: string) => /[a-zà-ú]{3,}/i.test(c) && !looksPrice(c) && !looksStatus(c);

    let priceIdx = cells.findIndex(looksPrice);
    if (priceIdx >= 0 && /valor/i.test(cells[priceIdx]) && !/r\$|\d/.test(cells[priceIdx])) {
      priceIdx = cells.findIndex((c, i) => i > priceIdx && looksPrice(c));
    }

    let cardIdx = -1;
    for (let i = priceIdx > 0 ? priceIdx - 1 : cells.length - 1; i >= 0; i--) {
      if (looksCard(cells[i])) {
        cardIdx = i;
        break;
      }
    }
    if (cardIdx < 0) cardIdx = cells.findIndex(looksCard);
    if (cardIdx < 0) continue;

    const buyer = cells.find((c, i) => i !== cardIdx && c && looksCard(c)) ?? "";
    const cardText = cells[cardIdx];
    const priceCell = priceIdx >= 0 ? cells[priceIdx] : "";
    const afterPrice = priceIdx >= 0 ? cells.slice(priceIdx + 1) : [];
    const statusCell = afterPrice.find(looksStatus) ?? cells.find(looksStatus) ?? "";
    const notes = afterPrice
      .filter((c) => c && !looksStatus(c))
      .join(" ")
      .trim();

    const { price, free } = parsePrice(priceCell);
    const { name, number, printedTotal } = parseCard(cardText);
    out.push({
      raw: line,
      buyer,
      cardText,
      name,
      number,
      printedTotal,
      price,
      free,
      paymentStatus: parseStatus(statusCell),
      notes,
    });
  }
  return out;
}

// ---- TCG matching (browser) ---------------------------------------------

const API_BASE = "https://api.pokemontcg.io/v2";
const normNum = (s: string) => s.replace(/^0+/, "").toLowerCase().trim();

export type TcgCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images?: { small?: string; large?: string };
  set?: { id?: string; name?: string; printedTotal?: number; total?: number };
};

export async function tcgSearchByName(name: string, tries = 4): Promise<TcgCard[]> {
  const q = encodeURIComponent(`name:"${name.replace(/"/g, "")}"`);
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 400 * i + Math.random() * 300));
    try {
      const res = await fetch(`${API_BASE}/cards?q=${q}&pageSize=250`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const j = (await res.json()) as { data?: TcgCard[] };
        return j.data ?? [];
      }
    } catch {
      /* retry */
    }
  }
  return [];
}

export function pickMatch(row: ParsedRow, pool: TcgCard[]): { match: CardMatch | null; ambiguous: boolean } {
  const exact = pool.filter((c) => c.name.toLowerCase() === row.name.toLowerCase());
  let cand = exact.length > 0 ? exact : pool;

  if (row.number) {
    const wantNum = normNum(row.number.split("/")[0]);
    const byNum = cand.filter((c) => normNum(c.number) === wantNum);
    if (byNum.length > 0) cand = byNum;
    if (row.printedTotal) {
      const byTotal = cand.filter(
        (c) => c.set?.printedTotal === row.printedTotal || c.set?.total === row.printedTotal
      );
      if (byTotal.length > 0) cand = byTotal;
    }
  }

  const pick = cand[0] ?? null;
  return {
    ambiguous: cand.length > 1,
    match: pick
      ? {
          tcg_api_id: pick.id,
          name: pick.name,
          set_name: pick.set?.name ?? "",
          card_number: row.number || pick.number,
          image_url:
            pick.images?.large ||
            pick.images?.small ||
            (pick.set?.id ? `https://images.pokemontcg.io/${pick.set.id}/${pick.number}.png` : ""),
          rarity: pick.rarity ?? null,
        }
      : null,
  };
}
