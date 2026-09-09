"use client";

import { useState, useTransition } from "react";
import { Gavel, Plus, Pencil, Trash2, Star, Loader2, Check } from "lucide-react";
import type { Auction } from "@/lib/supabase/types";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { ImageUploadField } from "@/components/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { saveAuction, deleteAuction, setFeaturedAuction, type AuctionInput } from "./actions";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

const empty: AuctionInput = { title: "", happens_at: "", note: "", image_url: "", result: "" };

export function LeiloesClient({ initial }: { initial: Auction[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AuctionInput>(empty);
  const [busy, startSave] = useTransition();
  const [featBusy, startFeat] = useTransition();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function openNew() {
    setForm(empty);
    setEditing("new");
    setErr(null);
  }
  function openEdit(a: Auction) {
    setForm({
      title: a.title,
      happens_at: toLocalInput(a.happens_at),
      note: a.note ?? "",
      image_url: a.image_url ?? "",
      result: a.result ?? "",
    });
    setEditing(a.id);
    setErr(null);
  }

  function submit() {
    setErr(null);
    startSave(async () => {
      try {
        await saveAuction(editing === "new" ? null : editing, form);
        window.location.reload();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Não deu pra salvar.");
      }
    });
  }

  function feature(id: string | null) {
    startFeat(async () => {
      await setFeaturedAuction(id);
      setRows((prev) => prev.map((r) => ({ ...r, featured: r.id === id })));
    });
  }

  async function remove(id: string) {
    await deleteAuction(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    setConfirmDel(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="LEILÕES"
        subtitle="A chamada que aparece na página inicial. O lance continua no grupo."
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo leilão
          </Button>
        }
      />

      {editing !== null && (
        <div className="mt-6 space-y-3 rounded-2xl border-2 border-orange/30 bg-orange/5 p-4">
          <h2 className="flex items-center gap-2 font-display text-lg tracking-wide text-ink">
            <Gavel className="h-4 w-4 text-primary" />
            {editing === "new" ? "NOVO LEILÃO" : "EDITAR LEILÃO"}
          </h2>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Leilão de sábado — coleção do Wilker"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Quando</Label>
              <Input
                type="datetime-local"
                value={form.happens_at}
                onChange={(e) => setForm((f) => ({ ...f, happens_at: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Resultado (depois do leilão)</Label>
              <Input
                value={form.result}
                onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                placeholder="Ex: 12 lotes arrematados"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Chamada (opcional)</Label>
            <Textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Vintage, ex e uns SIR. Enquete abre 20h."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Imagem (opcional)</Label>
            <ImageUploadField
              shape="square"
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-2.5">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
            Nenhum leilão cadastrado.
          </p>
        )}
        {rows.map((a) => (
          <li
            key={a.id}
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 bg-surface p-3 ${
              a.featured ? "border-orange-deep" : "border-border"
            }`}
          >
            {a.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin image
              <img src={a.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-alt">
                <Gavel className="h-5 w-5 text-ink-muted" />
              </div>
            )}
            <div className="min-w-0 flex-1 basis-40">
              <p className="truncate text-sm font-semibold text-ink">
                {a.title}
                {a.featured && (
                  <span className="ml-2 rounded-full bg-orange-deep/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-deep">
                    na home
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-muted">
                {a.happens_at
                  ? new Date(a.happens_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "sem data"}
                {a.result ? ` · ${a.result}` : ""}
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                title={a.featured ? "Tirar da home" : "Destacar na home"}
                disabled={featBusy}
                onClick={() => feature(a.featured ? null : a.id)}
              >
                <Star
                  className={`h-4 w-4 ${a.featured ? "fill-orange-deep text-orange-deep" : ""}`}
                />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDel(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmDel !== null}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Apagar esse leilão?"
        confirmLabel="Apagar"
        destructive
        onConfirm={() => confirmDel && remove(confirmDel)}
      />
    </div>
  );
}
