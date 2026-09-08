"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import type { Card } from "@/lib/supabase/types";
import { createCard, updateCard, deleteCard } from "./actions";

const STATUS_LABEL: Record<Card["status"], string> = {
  available: "Disponível",
  in_auction: "Em leilão",
  sold: "Vendida",
};

const STATUS_COLOR: Record<Card["status"], string> = {
  available: "bg-teal/15 text-teal",
  in_auction: "bg-yellow/20 text-orange-deep",
  sold: "bg-ink/10 text-ink-muted",
};

export function CartasClient({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState(initialCards);
  const [editing, setEditing] = useState<Card | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Remover essa carta?")) return;
    setDeletingId(id);
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">CARTAS</h1>
          <p className="mt-1 text-sm text-ink-muted">Catálogo pro leilão e vendas.</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-full bg-orange-deep px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nova carta
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface">
        {cards.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">Nenhuma carta cadastrada ainda.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink/10 text-xs font-semibold text-ink-muted">
                <th className="px-5 py-3">Carta</th>
                <th className="px-5 py-3">Condição</th>
                <th className="px-5 py-3">Preço inicial</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className="border-b border-ink/5 last:border-0">
                  <td className="flex items-center gap-3 px-5 py-3">
                    {card.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs, not worth whitelisting every hostname
                      <img
                        src={card.image_url}
                        alt={card.name}
                        width={32}
                        height={44}
                        className="h-11 w-8 rounded-sm object-cover"
                      />
                    ) : (
                      <div className="h-11 w-8 rounded-sm bg-surface-alt" />
                    )}
                    <div>
                      <p className="font-semibold text-ink">{card.name}</p>
                      {card.set_name && <p className="text-xs text-ink-muted">{card.set_name}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{card.condition || "—"}</td>
                  <td className="px-5 py-3 text-ink-muted">
                    {card.starting_price != null ? `R$ ${card.starting_price.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[card.status]}`}
                    >
                      {STATUS_LABEL[card.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(card)}
                        className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        disabled={deletingId === card.id}
                        className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-orange-deep"
                      >
                        {deletingId === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <CardModal
          card={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(card) => {
            setCards((prev) =>
              editing === "new"
                ? [card, ...prev]
                : prev.map((c) => (c.id === card.id ? card : c))
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CardModal({
  card,
  onClose,
  onSaved,
}: {
  card: Card | null;
  onClose: () => void;
  onSaved: (card: Card) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      if (card) {
        await updateCard(card.id, formData);
        onSaved({
          ...card,
          name: formData.get("name") as string,
          set_name: (formData.get("set_name") as string) || null,
          image_url: (formData.get("image_url") as string) || null,
          condition: (formData.get("condition") as string) || null,
          description: (formData.get("description") as string) || null,
          starting_price: formData.get("starting_price")
            ? Number(formData.get("starting_price"))
            : null,
          status: formData.get("status") as Card["status"],
        });
      } else {
        await createCard(formData);
        // A full card row (with generated id) isn't returned by the action,
        // so just close and let the server-rendered list refresh via revalidatePath.
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra salvar.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="w-full max-w-md rounded-2xl border-2 border-ink/10 bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">
            {card ? "EDITAR CARTA" : "NOVA CARTA"}
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            name="name"
            required
            defaultValue={card?.name}
            placeholder="Nome da carta"
            className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-orange-deep"
          />
          <input
            name="set_name"
            defaultValue={card?.set_name ?? ""}
            placeholder="Coleção (opcional)"
            className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-orange-deep"
          />
          <input
            name="image_url"
            defaultValue={card?.image_url ?? ""}
            placeholder="URL da imagem"
            className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-orange-deep"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="condition"
              defaultValue={card?.condition ?? ""}
              placeholder="Condição (NM, LP...)"
              className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-orange-deep"
            />
            <input
              name="starting_price"
              type="number"
              step="0.01"
              defaultValue={card?.starting_price ?? ""}
              placeholder="Preço inicial"
              className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-orange-deep"
            />
          </div>
          <select
            name="status"
            defaultValue={card?.status ?? "available"}
            className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-orange-deep"
          >
            <option value="available">Disponível</option>
            <option value="in_auction">Em leilão</option>
            <option value="sold">Vendida</option>
          </select>
          <textarea
            name="description"
            defaultValue={card?.description ?? ""}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2 text-sm text-ink outline-none focus:border-orange-deep"
          />

          {error && <p className="text-sm text-orange-deep">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-deep px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}
