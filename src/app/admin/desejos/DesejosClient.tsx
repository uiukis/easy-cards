"use client";

import { useMemo, useState } from "react";
import { Search, X, Users, LayoutGrid, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { PokemonAvatar } from "@/components/PokemonAvatar";
import { Input } from "@/components/ui/input";

export type WishRow = {
  id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string;
  rarity: string | null;
  priority: number;
  note: string | null;
  created_at: string;
  user_id: string;
  person_name: string;
  person_phone: string | null;
  person_avatar: string | null;
  person_public: boolean;
  person_slug: string | null;
};

const PRIORITY: Record<number, { short: string; tone: string }> = {
  1: { short: "Alta", tone: "bg-destructive/15 text-destructive" },
  2: { short: "Normal", tone: "bg-orange/15 text-orange-deep" },
  3: { short: "Baixa", tone: "bg-ink/10 text-ink-muted" },
};

function waLink(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export function DesejosClient({ rows }: { rows: WishRow[] }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"card" | "person">("card");

  const term = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !term ||
          `${r.name} ${r.set_name ?? ""} ${r.card_number ?? ""} ${r.person_name}`
            .toLowerCase()
            .includes(term)
      ),
    [rows, term]
  );

  const byCard = useMemo(() => {
    const map = new Map<string, { label: string; sub: string; image: string; rows: WishRow[] }>();
    for (const r of filtered) {
      const key = (r.name + "|" + (r.card_number ?? "")).toLowerCase();
      const cur = map.get(key) ?? {
        label: r.name,
        sub: [r.set_name, r.card_number].filter(Boolean).join(" · "),
        image: r.image_url,
        rows: [],
      };
      cur.rows.push(r);
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
  }, [filtered]);

  const byPerson = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string | null; phone: string | null; slug: string | null; pub: boolean; rows: WishRow[] }>();
    for (const r of filtered) {
      const cur = map.get(r.user_id) ?? {
        name: r.person_name,
        avatar: r.person_avatar,
        phone: r.person_phone,
        slug: r.person_slug,
        pub: r.person_public,
        rows: [],
      };
      cur.rows.push(r);
      map.set(r.user_id, cur);
    }
    return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
  }, [filtered]);

  const people = new Set(rows.map((r) => r.user_id)).size;

  return (
    <div>
      <AdminPageHeader
        title="LISTAS DE DESEJO"
        subtitle={`${rows.length} carta(s) que ${people} pessoa(s) estão caçando.`}
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar carta ou pessoa…"
            className="h-9 pl-8 text-sm"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              aria-label="Limpar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-full border-2 border-ink/10 bg-surface p-1">
          <button
            onClick={() => setMode("card")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              mode === "card" ? "bg-orange-deep text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Por carta
          </button>
          <button
            onClick={() => setMode("person")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              mode === "person" ? "bg-orange-deep text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Por pessoa
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
          Nada por aqui{term ? " com esse filtro" : " ainda"}.
        </p>
      ) : mode === "card" ? (
        <div className="mt-4 space-y-2.5">
          {byCard.map((c) => (
            <div key={c.label + c.sub} className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                <img src={c.image} alt={c.label} className="h-16 w-11 shrink-0 rounded-sm object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{c.label}</p>
                  {c.sub && <p className="truncate text-xs text-ink-muted">{c.sub}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-orange/15 px-2 py-0.5 text-xs font-bold text-orange-deep">
                  {c.rows.length} {c.rows.length === 1 ? "pessoa" : "pessoas"}
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5 border-t border-border pt-2.5">
                {c.rows.map((r) => (
                  <PersonLine key={r.id} r={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {byPerson.map((p) => (
            <div key={p.name + (p.slug ?? "")} className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-center gap-3">
                <PokemonAvatar sprite={p.avatar} name={p.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.rows.length} carta(s)</p>
                </div>
                {waLink(p.phone) && (
                  <a
                    href={waLink(p.phone)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full border-2 border-ink/15 px-2.5 py-1 text-xs font-bold text-ink hover:bg-surface-alt"
                  >
                    WhatsApp
                  </a>
                )}
                {p.pub && p.slug && (
                  <a
                    href={`/u/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full border-2 border-ink/15 p-1.5 text-ink hover:bg-surface-alt"
                    aria-label="Ver lista pública"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2.5 sm:grid-cols-3">
                {p.rows.map((r) => (
                  <div key={r.id} className="flex gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- external card art */}
                    <img src={r.image_url} alt={r.name} className="h-14 w-10 shrink-0 rounded-sm object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">{r.name}</p>
                      <p className="truncate text-[11px] text-ink-muted">
                        {r.card_number ?? ""}
                        {r.note ? ` · “${r.note}”` : ""}
                      </p>
                      <span
                        className={`mt-0.5 inline-block rounded px-1 py-0.5 text-[9px] font-bold ${PRIORITY[r.priority].tone}`}
                      >
                        {PRIORITY[r.priority].short}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonLine({ r }: { r: WishRow }) {
  const wa = waLink(r.person_phone);
  return (
    <div className="flex items-center gap-2 text-xs">
      <PokemonAvatar sprite={r.person_avatar} name={r.person_name} size={20} />
      <span className="flex-1 truncate font-semibold text-ink">{r.person_name}</span>
      {r.note && <span className="hidden truncate text-ink-muted sm:inline">“{r.note}”</span>}
      <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${PRIORITY[r.priority].tone}`}>
        {PRIORITY[r.priority].short}
      </span>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-bold text-teal hover:underline"
        >
          zap
        </a>
      )}
    </div>
  );
}
