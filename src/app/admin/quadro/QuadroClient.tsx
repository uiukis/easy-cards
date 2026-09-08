"use client";

import { useState } from "react";
import { Calendar, Megaphone, Handshake, Newspaper, Plus, Trash2, Loader2 } from "lucide-react";
import type { Announcement, EventSettings, Supporter, PressMention } from "@/lib/supabase/types";
import {
  updateEventSettings,
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
  createSupporter,
  toggleSupporter,
  deleteSupporter,
  createPressMention,
  togglePressMention,
  deletePressMention,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIER_OPTIONS = [
  { value: "leilao_misto", label: "Leilão misto (20% de comissão)" },
  { value: "leilao_exclusivo", label: "Leilão exclusivo (35% de comissão)" },
  { value: "outro", label: "Outro / parceria pontual" },
];
const TIER_LABEL: Record<string, string> = Object.fromEntries(
  TIER_OPTIONS.map((t) => [t.value, t.label])
);

export function QuadroClient({
  eventSettings,
  initialAnnouncements,
  initialSupporters,
  initialPressMentions,
}: {
  eventSettings: EventSettings | null;
  initialAnnouncements: Announcement[];
  initialSupporters: Supporter[];
  initialPressMentions: PressMention[];
}) {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">QUADRO</h1>
      <p className="mt-1 text-sm text-ink-muted">Evento, avisos, apoiadores e imprensa visíveis no site.</p>

      <Tabs defaultValue="evento" className="mt-6">
        <TabsList>
          <TabsTrigger value="evento">
            <Calendar className="h-4 w-4" /> Evento
          </TabsTrigger>
          <TabsTrigger value="avisos">
            <Megaphone className="h-4 w-4" /> Avisos
          </TabsTrigger>
          <TabsTrigger value="apoiadores">
            <Handshake className="h-4 w-4" /> Apoiadores
          </TabsTrigger>
          <TabsTrigger value="imprensa">
            <Newspaper className="h-4 w-4" /> Imprensa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evento" className="mt-4">
          <EventoTab eventSettings={eventSettings} />
        </TabsContent>
        <TabsContent value="avisos" className="mt-4">
          <AvisosTab initial={initialAnnouncements} />
        </TabsContent>
        <TabsContent value="apoiadores" className="mt-4">
          <ApoiadoresTab initial={initialSupporters} />
        </TabsContent>
        <TabsContent value="imprensa" className="mt-4">
          <ImprensaTab initial={initialPressMentions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventoTab({ eventSettings }: { eventSettings: EventSettings | null }) {
  const [title, setTitle] = useState(eventSettings?.title ?? "");
  const [eventDate, setEventDate] = useState(eventSettings?.event_date ?? "");
  const [place, setPlace] = useState(eventSettings?.place ?? "");
  const [tag, setTag] = useState(eventSettings?.tag ?? "");
  const [formUrl, setFormUrl] = useState(eventSettings?.form_url ?? "");
  const [bannerMessage, setBannerMessage] = useState(eventSettings?.banner_message ?? "");
  const [bannerEnabled, setBannerEnabled] = useState(eventSettings?.banner_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateEventSettings({
      title,
      event_date: eventDate,
      place,
      tag,
      banner_enabled: bannerEnabled,
      banner_message: bannerMessage,
      form_url: formUrl,
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <Card className="max-w-md">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Local</Label>
              <Input value={place} onChange={(e) => setPlace(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tag</Label>
            <Input
              placeholder="Ex: Educativo, não competitivo"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Link do formulário de inscrição</Label>
            <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mensagem do banner</Label>
            <Input value={bannerMessage} onChange={(e) => setBannerMessage(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
            Mostrar banner no site
          </label>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          {saved && <p className="text-sm text-teal">Salvo!</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function AvisosTab({ initial }: { initial: Announcement[] }) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    await createAnnouncement(message);
    setItems((prev) => [
      { id: crypto.randomUUID(), message, active: true, created_at: new Date().toISOString() },
      ...prev,
    ]);
    setMessage("");
    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Novo aviso..."
          className="flex-1"
        />
        <Button type="submit" disabled={saving} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3">
                <span className={`text-sm ${a.active ? "text-ink" : "text-ink-muted line-through"}`}>
                  {a.message}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await toggleAnnouncement(a.id, !a.active);
                      setItems((prev) =>
                        prev.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x))
                      );
                    }}
                  >
                    {a.active ? "desativar" : "ativar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      await deleteAnnouncement(a.id);
                      setItems((prev) => prev.filter((x) => x.id !== a.id));
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
    </div>
  );
}

function ApoiadoresTab({ initial }: { initial: Supporter[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tier, setTier] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await createSupporter({ name, instagram, image_url: imageUrl, tier });
    setItems((prev) => [
      {
        id: crypto.randomUUID(),
        name,
        instagram: instagram || null,
        image_url: imageUrl || null,
        tier: tier || null,
        active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setName("");
    setInstagram("");
    setImageUrl("");
    setTier("");
    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-2">
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
              placeholder="URL da foto (ex: link da foto de perfil do Instagram dele)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Select value={tier} onValueChange={(v) => setTier(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => TIER_LABEL[v] ?? "Categoria da parceria"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

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
                    <div className="h-10 w-10 rounded-full bg-surface-alt" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.name}</p>
                    {s.tier && (
                      <p className="text-xs text-ink-muted">{TIER_LABEL[s.tier] ?? s.tier}</p>
                    )}
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
                    {s.active ? "desativar" : "ativar"}
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
    </div>
  );
}

function ImprensaTab({ initial }: { initial: PressMention[] }) {
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [outlet, setOutlet] = useState("");
  const [outletInstagram, setOutletInstagram] = useState("");
  const [journalist, setJournalist] = useState("");
  const [journalistInstagram, setJournalistInstagram] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
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
    setTitle("");
    setOutlet("");
    setOutletInstagram("");
    setJournalist("");
    setJournalistInstagram("");
    setUrl("");
    setImageUrl("");
    setPublishedDate("");
    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-2">
            <Input
              placeholder="Título da matéria"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input placeholder="Link da matéria" value={url} onChange={(e) => setUrl(e.target.value)} />
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
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3">
                <div className={`flex items-center gap-3 ${p.active ? "" : "opacity-50"}`}>
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
                    <img src={p.image_url} alt={p.title} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-surface-alt" />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-ink">{p.title}</p>
                    <p className="text-xs text-ink-muted">
                      {p.outlet}
                      {p.journalist && ` · ${p.journalist}`}
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
                    {p.active ? "desativar" : "ativar"}
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
    </div>
  );
}
