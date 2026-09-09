"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Handshake, Newspaper, Plus, Trash2, Eye, Pencil, X } from "lucide-react";
import type { Supporter, PressMention } from "@/lib/supabase/types";
import {
  createSupporter,
  updateSupporter,
  toggleSupporter,
  deleteSupporter,
  createPressMention,
  updatePressMention,
  togglePressMention,
  deletePressMention,
} from "./actions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { PressCard } from "@/components/PressSection";
import { InstagramIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
        <Eye className="h-3.5 w-3.5" />
        Prévia do site
      </div>
      <div className="mt-2 rounded-2xl border-2 border-dashed border-ink/15 bg-halftone bg-bg p-5">
        {children}
      </div>
    </div>
  );
}

export function QuadroClient({
  initialSupporters,
  initialPressMentions,
}: {
  initialSupporters: Supporter[];
  initialPressMentions: PressMention[];
}) {
  return (
    <div>
      <AdminPageHeader title="QUADRO" subtitle="Apoiadores e imprensa visíveis no site." />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      >
        <Tabs defaultValue="apoiadores" className="mt-6">
          <TabsList>
            <TabsTrigger value="apoiadores">
              <Handshake className="h-4 w-4" /> Apoiadores
            </TabsTrigger>
            <TabsTrigger value="imprensa">
              <Newspaper className="h-4 w-4" /> Imprensa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apoiadores" className="mt-4">
            <ApoiadoresTab initial={initialSupporters} />
          </TabsContent>
          <TabsContent value="imprensa" className="mt-4">
            <ImprensaTab initial={initialPressMentions} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function ApoiadoresTab({ initial }: { initial: Supporter[] }) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setName("");
    setInstagram("");
    setImageUrl("");
  }

  function startEdit(s: Supporter) {
    setEditingId(s.id);
    setName(s.name);
    setInstagram(s.instagram ?? "");
    setImageUrl(s.image_url ?? "");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    if (editingId) {
      await updateSupporter(editingId, { name, instagram, image_url: imageUrl });
      setItems((prev) =>
        prev.map((x) =>
          x.id === editingId
            ? { ...x, name, instagram: instagram || null, image_url: imageUrl || null }
            : x
        )
      );
    } else {
      await createSupporter({ name, instagram, image_url: imageUrl });
      setItems((prev) => [
        {
          id: crypto.randomUUID(),
          name,
          instagram: instagram || null,
          image_url: imageUrl || null,
          active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    resetForm();
    setSaving(false);
  }

  const active = items.filter((s) => s.active);

  return (
    <div className="space-y-6">
      <div className="max-w-lg space-y-4">
        <Card>
          <CardContent>
            {editingId && (
              <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-orange-deep">
                Editando apoiador
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-ink-muted hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" /> cancelar
                </button>
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-2">
              <Input
                placeholder="Nome do apoiador"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Instagram (URL)"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
              <Input
                placeholder="URL da foto (ex: foto de perfil do Instagram dele)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button type="submit" disabled={saving}>
                <Plus className="h-4 w-4" /> {editingId ? "Salvar alterações" : "Adicionar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
            {items.length} {items.length === 1 ? "apoiador" : "apoiadores"}
          </p>
          {items.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-ink/15 px-4 py-6 text-center text-sm text-ink-muted">
              Nenhum apoiador cadastrado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((s) => (
                <li key={s.id}>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className={`flex items-center gap-3 ${s.active ? "" : "opacity-50"}`}>
                        {s.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                          <img
                            src={s.image_url}
                            alt={s.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt font-display text-sm text-orange-deep">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-ink">{s.name}</p>
                          {!s.active && <p className="text-xs text-ink-muted">oculto no site</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await toggleSupporter(s.id, !s.active);
                            setItems((prev) =>
                              prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x))
                            );
                          }}
                        >
                          {s.active ? "ocultar" : "mostrar"}
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => startEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            await deleteSupporter(s.id);
                            setItems((prev) => prev.filter((x) => x.id !== s.id));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PreviewFrame>
        {active.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-muted">
            Nada aparece no site enquanto não tiver apoiador ativo.
          </p>
        ) : (
          <div className="text-center">
            <Handshake className="mx-auto h-7 w-7 text-orange-deep" />
            <h3 className="mt-3 font-display text-2xl leading-tight text-ink">
              QUEM JÁ APOIA A EASY CARDS
            </h3>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
              {active.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="h-16 w-16 rounded-full border-2 border-ink/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink/10 bg-surface font-display text-lg text-orange-deep">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    {s.name}
                    {s.instagram && <InstagramIcon className="h-3 w-3 text-ink-muted" />}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-ink-muted">
              Aparece na página <span className="font-semibold">/apoiador</span>.
            </p>
          </div>
        )}
      </PreviewFrame>
    </div>
  );
}

function ImprensaTab({ initial }: { initial: PressMention[] }) {
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [outlet, setOutlet] = useState("");
  const [outletInstagram, setOutletInstagram] = useState("");
  const [journalist, setJournalist] = useState("");
  const [journalistInstagram, setJournalistInstagram] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setOutlet("");
    setOutletInstagram("");
    setJournalist("");
    setJournalistInstagram("");
    setUrl("");
    setImageUrl("");
    setPublishedDate("");
  }

  function startEdit(p: PressMention) {
    setEditingId(p.id);
    setTitle(p.title);
    setOutlet(p.outlet);
    setOutletInstagram(p.outlet_instagram ?? "");
    setJournalist(p.journalist ?? "");
    setJournalistInstagram(p.journalist_instagram ?? "");
    setUrl(p.url);
    setImageUrl(p.image_url ?? "");
    setPublishedDate(p.published_date?.slice(0, 10) ?? "");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !outlet.trim() || !url.trim()) return;
    setSaving(true);
    const input = {
      title,
      outlet,
      outlet_instagram: outletInstagram,
      journalist,
      journalist_instagram: journalistInstagram,
      url,
      image_url: imageUrl,
      published_date: publishedDate,
    };
    if (editingId) {
      await updatePressMention(editingId, input);
      setItems((prev) =>
        prev.map((x) =>
          x.id === editingId
            ? {
                ...x,
                title,
                outlet,
                outlet_instagram: outletInstagram || null,
                journalist: journalist || null,
                journalist_instagram: journalistInstagram || null,
                url,
                image_url: imageUrl || null,
                published_date: publishedDate || null,
              }
            : x
        )
      );
    } else {
      await createPressMention(input);
      setItems((prev) => [
        {
          id: crypto.randomUUID(),
          title,
          outlet,
          outlet_instagram: outletInstagram || null,
          journalist: journalist || null,
          journalist_instagram: journalistInstagram || null,
          url,
          image_url: imageUrl || null,
          published_date: publishedDate || null,
          active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    resetForm();
    setSaving(false);
  }

  const active = items.filter((p) => p.active);

  return (
    <div className="space-y-6">
      <div className="max-w-lg space-y-4">
        <Card>
          <CardContent>
            {editingId && (
              <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-orange-deep">
                Editando matéria
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-ink-muted hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" /> cancelar
                </button>
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-2">
              <Input
                placeholder="Título da matéria"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Link da matéria"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Input
                placeholder="Imagem de capa (URL)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Veículo (ex: Tudo de Novo)"
                  value={outlet}
                  onChange={(e) => setOutlet(e.target.value)}
                />
                <Input
                  placeholder="Instagram do veículo"
                  value={outletInstagram}
                  onChange={(e) => setOutletInstagram(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Jornalista"
                  value={journalist}
                  onChange={(e) => setJournalist(e.target.value)}
                />
                <Input
                  placeholder="Instagram do jornalista"
                  value={journalistInstagram}
                  onChange={(e) => setJournalistInstagram(e.target.value)}
                />
              </div>
              <Input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
              />
              <Button type="submit" disabled={saving}>
                <Plus className="h-4 w-4" /> {editingId ? "Salvar alterações" : "Adicionar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
            {items.length} {items.length === 1 ? "matéria" : "matérias"}
          </p>
          {items.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-ink/15 px-4 py-6 text-center text-sm text-ink-muted">
              Nenhuma matéria cadastrada ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((p) => (
                <li key={p.id}>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className={`flex items-center gap-3 ${p.active ? "" : "opacity-50"}`}>
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-surface-alt" />
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-ink">{p.title}</p>
                          <p className="text-xs text-ink-muted">
                            {p.outlet}
                            {p.journalist && ` · ${p.journalist}`}
                            {!p.active && " · oculto no site"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await togglePressMention(p.id, !p.active);
                            setItems((prev) =>
                              prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x))
                            );
                          }}
                        >
                          {p.active ? "ocultar" : "mostrar"}
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => startEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            await deletePressMention(p.id);
                            setItems((prev) => prev.filter((x) => x.id !== p.id));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PreviewFrame>
        {active.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-muted">
            A seção some do site enquanto não tiver matéria ativa.
          </p>
        ) : (
          <div>
            <span className="font-comic text-sm tracking-wide text-orange-deep">★ Na mídia</span>
            <h3 className="mt-2 font-display text-2xl leading-tight text-ink">
              QUEM JÁ FALOU SOBRE A GENTE.
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.slice(0, 3).map((m) => (
                <PressCard key={m.id} mention={m} />
              ))}
            </div>
            <p className="mt-4 text-[11px] text-ink-muted">
              As 3 mais recentes aparecem na home; todas em{" "}
              <span className="font-semibold">/imprensa</span>.
            </p>
          </div>
        )}
      </PreviewFrame>
    </div>
  );
}
