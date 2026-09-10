"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePermissions } from "@/lib/get-permissions";

const API_BASE = "https://api.pokemontcg.io/v2";

async function requireCards() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me) throw new Error("Sem perfil.");
  const perms = await getEffectivePermissions(supabase, user.id, me.role);
  if (!perms.manage_cards) throw new Error("Sem permissão.");
  return { supabase, user };
}

// ---- parsing --------------------------------------------------------------

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

export type MatchedRow = ParsedRow & {
  match:
    | {
        tcg_api_id: string;
        name: string;
        set_name: string;
        card_number: string;
        image_url: string;
        rarity: string | null;
      }
    | null;
  ambiguous: boolean;
};

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

/** "Wimpod 025/078" -> {name:"Wimpod", number:"025/078", printedTotal:78} */
function parseCard(text: string) {
  const t = text.trim();
  const m = t.match(/^(.*?)[\s]+([A-Za-z]{0,3}\d{1,4})\s*\/\s*(\d{1,4})\s*$/);
  if (m) {
    return { name: normName(m[1]), number: `${m[2]}/${m[3]}`, printedTotal: Number(m[3]) };
  }
  // "Arceus-V 267/-" -> number only, no total
  const m2 = t.match(/^(.*?)[\s]+(\d{1,4})\s*\/\s*-\s*$/);
  if (m2) return { name: normName(m2[1]), number: `${m2[2]}/-`, printedTotal: null };
  // "Piloswine No.221" -> number only
  const m3 = t.match(/^(.*?)[\s]+n[o°.]\s*\.?\s*(\d{1,4})\s*$/i);
  if (m3) return { name: normName(m3[1]), number: m3[2], printedTotal: null };
  return { name: normName(t), number: "", printedTotal: null };
}

function parseRows(text: string): ParsedRow[] {
  const out: ParsedRow[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    // skip obvious header rows
    if (/^(nome|comprador|carta|lista de cartas|leil[aã]o|vendas|faturamento)\b/i.test(line)) continue;
    if (/^dia\s+\d/i.test(line)) continue;

    const cells = splitCells(line).map((c) => c.trim());
    if (cells.filter(Boolean).length < 2) continue;

    // Locate columns by shape rather than fixed position, so both the sheet's
    // "Nome | FOTO | Carta | Valor | Pagamento | Obs" and a trimmed
    // "Comprador | Carta | Valor | Pagamento" paste work.
    const looksPrice = (c: string) =>
      /gratu|gr[aá]tis|free|brinde/i.test(c) || /^r?\$?\d[\d.,]*$/i.test(c.replace(/\s/g, ""));
    const looksStatus = (c: string) => /^(x|aberto|parcial|efetuad[oa]|pago|quitad[oa])$/i.test(c.trim());
    const looksCard = (c: string) => /[a-zà-ú]{3,}/i.test(c) && !looksPrice(c) && !looksStatus(c);

    let priceIdx = cells.findIndex(looksPrice);
    // a lone "menor valor"/"valor médio" cell isn't a price
    if (priceIdx >= 0 && /valor/i.test(cells[priceIdx]) && !/r\$|\d/.test(cells[priceIdx])) {
      priceIdx = cells.findIndex((c, i) => i > priceIdx && looksPrice(c));
    }

    let cardIdx = -1;
    for (let i = (priceIdx > 0 ? priceIdx - 1 : cells.length - 1); i >= 0; i--) {
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
    const notes = afterPrice.filter((c) => c && !looksStatus(c)).join(" ").trim();

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

// ---- TCG matching -------------------------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tcgByName(name: string): Promise<TcgCard[]> {
  const q = encodeURIComponent(`name:"${name.replace(/"/g, "")}"`);
  for (let i = 0; i < 5; i++) {
    if (i > 0) await sleep(500 * i + Math.random() * 400);
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

/** Run tasks with limited concurrency so a big paste doesn't take forever. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

type TcgCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images?: { small?: string; large?: string };
  set?: { id?: string; name?: string; printedTotal?: number; total?: number };
};

const normNum = (s: string) => s.replace(/^0+/, "").toLowerCase().trim();

export async function parseAndMatch(text: string): Promise<MatchedRow[]> {
  await requireCards();
  const rows = parseRows(text);

  // one API call per distinct name, a few in flight at a time
  const names = [...new Set(rows.map((r) => r.name.toLowerCase()).filter((n) => n.length >= 3))];
  const results = await mapLimit(names, 4, (n) => tcgByName(n));
  const pools = new Map<string, TcgCard[]>();
  names.forEach((n, i) => pools.set(n, results[i]));

  return rows.map((r) => {
    const pool = pools.get(r.name.toLowerCase()) ?? [];
    const exact = pool.filter((c) => c.name.toLowerCase() === r.name.toLowerCase());
    let candidates = exact.length > 0 ? exact : pool;

    if (r.number) {
      const wantNum = normNum(r.number.split("/")[0]);
      const byNum = candidates.filter((c) => normNum(c.number) === wantNum);
      if (byNum.length > 0) candidates = byNum;
      if (r.printedTotal) {
        const byTotal = candidates.filter(
          (c) => c.set?.printedTotal === r.printedTotal || c.set?.total === r.printedTotal
        );
        if (byTotal.length > 0) candidates = byTotal;
      }
    }

    const pick = candidates[0] ?? null;
    return {
      ...r,
      ambiguous: candidates.length > 1,
      match: pick
        ? {
            tcg_api_id: pick.id,
            name: pick.name,
            set_name: pick.set?.name ?? "",
            card_number: r.number || pick.number,
            image_url:
              pick.images?.large ||
              pick.images?.small ||
              (pick.set?.id ? `https://images.pokemontcg.io/${pick.set.id}/${pick.number}.png` : ""),
            rarity: pick.rarity ?? null,
          }
        : null,
    };
  });
}

// ---- import -------------------------------------------------------------

export type ImportRow = {
  buyer: string;
  price: number | null;
  free: boolean;
  paymentStatus: "aberto" | "parcial" | "pago";
  notes: string;
  card: {
    tcg_api_id: string;
    name: string;
    set_name: string;
    card_number: string;
    image_url: string;
    rarity: string | null;
  };
};

export async function importAuctionRows(
  rows: ImportRow[],
  opts: { auctionLabel: string; soldDate: string; dueDate: string }
) {
  const { supabase, user } = await requireCards();
  if (rows.length === 0) return { added: 0 };

  const soldAt = new Date(`${opts.soldDate || new Date().toISOString().slice(0, 10)}T12:00:00`).toISOString();
  let added = 0;

  for (const r of rows) {
    const { data: card, error: cardErr } = await supabase
      .from("cards")
      .insert({
        name: r.card.name,
        set_name: r.card.set_name || null,
        card_number: r.card.card_number || null,
        image_url: r.card.image_url || null,
        condition: "NM",
        status: "sold" as const,
        in_stock: false,
        price: r.price,
        tcg_api_id: r.card.tcg_api_id || null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (cardErr || !card) throw new Error(cardErr?.message ?? "Falha ao criar carta.");

    const price = r.free ? 0 : r.price;
    const { error: finErr } = await supabase.from("card_finance").insert({
      card_id: card.id,
      final_price: price,
      buyer_name: r.buyer || null,
      sold_at: soldAt,
      payment_status: r.paymentStatus,
      amount_paid: r.paymentStatus === "pago" ? price ?? 0 : 0,
      paid_at: r.paymentStatus === "pago" ? opts.soldDate || null : null,
      due_date: opts.dueDate || null,
      auction_label: opts.auctionLabel.trim() || null,
      notes: r.notes || (r.free ? "gratuito" : null),
      updated_by: user.id,
    });
    if (finErr) throw new Error(finErr.message);

    await supabase.rpc("notify_wishlist_match", {
      p_name: r.card.name,
      p_card_number: r.card.card_number || "",
      p_tcg_api_id: r.card.tcg_api_id || "",
      p_image_url: r.card.image_url || "",
    });
    added++;
  }

  revalidatePath("/admin/cartas");
  revalidatePath("/admin/financeiro");
  return { added };
}
