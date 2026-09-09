"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  Phone,
  BadgeCheck,
  AtSign,
  Mail,
  Check,
} from "lucide-react";
import type { Profile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { maskPhoneBR } from "@/lib/phone";
import { SITE } from "@/lib/site";
import { updateOwnProfile, setUsername } from "./actions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { PokemonAvatar } from "@/components/PokemonAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PerfilClient({
  profile,
  email,
  emailConfirmed,
  pendingEmail,
}: {
  profile: Profile;
  email: string | null;
  emailConfirmed: boolean;
  pendingEmail: string | null;
}) {
  const [species, setSpecies] = useState<string[]>([]);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [favoritePokemon, setFavoritePokemon] = useState(profile.favorite_pokemon ?? "");
  const [sprite, setSprite] = useState(profile.favorite_pokemon_sprite);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon-species?limit=1025")
      .then((res) => res.json())
      .then((data: { results: { name: string }[] }) => {
        setSpecies(data.results.map((p) => capitalize(p.name)));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await updateOwnProfile({ full_name: fullName, favorite_pokemon: favoritePokemon });
    setSprite(res.sprite);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <AdminPageHeader title="MEU PERFIL" subtitle="Seus dados de acesso e o avatar do sistema." />

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div className="flex items-center gap-4">
          <PokemonAvatar sprite={sprite} name={fullName} size={72} />
          <div className="text-sm text-ink-muted">
            {favoritePokemon ? (
              <>
                Seu avatar é o <span className="font-semibold text-ink">{favoritePokemon}</span> —
                aparece do seu lado no painel.
              </>
            ) : (
              "Escolha um Pokémon favorito e ele vira seu avatar no sistema."
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Nome completo</Label>
          <Input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!!profile.verified_at}
          />
          {profile.verified_at ? (
            <p className="flex items-center gap-1.5 text-xs text-teal">
              <BadgeCheck className="h-3.5 w-3.5" />
              Conta verificada. Pra mudar o nome, fale com a equipe.
            </p>
          ) : (
            <p className="text-xs text-ink-muted">
              Conta ainda não verificada. Pediu pra alguém da equipe confirmar quem é você? Aí seu
              nome completo aparece pros outros e você ganha o selo ✓.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Telefone (usado pra entrar)
          </Label>
          <Input
            disabled
            value={
              profile.phone ? maskPhoneBR(profile.phone.replace(/^55/, "")) : "sem telefone"
            }
          />
          <p className="text-xs text-ink-muted">
            Errou o número no cadastro?{" "}
            <a
              href={SITE.whatsappGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Fala com a gente no grupo
            </a>{" "}
            que a equipe corrige.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Pokémon favorito (opcional)
          </Label>
          <Input
            list="pokemon-species"
            placeholder="Charizard"
            value={favoritePokemon}
            onChange={(e) => setFavoritePokemon(e.target.value)}
          />
          <datalist id="pokemon-species">
            {species.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </Button>
        {saved && <p className="text-sm text-teal">Salvo!</p>}
      </form>

      <UsernameSection initial={profile.username} />
      <EmailSection email={email} confirmed={emailConfirmed} pending={pendingEmail} />
      <PasswordSection />
    </div>
  );
}

function UsernameSection({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const clean = value.trim().toLowerCase();
  const valid = /^[a-z0-9_]{3,20}$/.test(clean);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await setUsername(clean);
    setBusy(false);
    if (res.ok) {
      setSaved(res.username);
      setValue(res.username);
      setMsg({ ok: true, text: "Nome de usuário salvo." });
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="mt-10 max-w-md space-y-3">
      <div className="flex items-center gap-2">
        <AtSign className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg text-ink">NOME DE USUÁRIO</h2>
      </div>
      <p className="text-xs text-ink-muted">
        Vira o link do seu perfil público:{" "}
        <span className="font-mono text-ink">
          {typeof window !== "undefined" ? window.location.host : "easycards"}/u/{saved || "seu-nome"}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">@</span>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^A-Za-z0-9_]/g, "").toLowerCase())}
            placeholder="seu_nome"
            maxLength={20}
            className="pl-7"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={save}
          disabled={busy || !valid || clean === (saved ?? "")}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvar
        </Button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-teal" : "text-destructive"}`}>{msg.text}</p>
      )}
    </div>
  );
}

function EmailSection({
  email,
  confirmed,
  pending,
}: {
  email: string | null;
  confirmed: boolean;
  pending: string | null;
}) {
  const [value, setValue] = useState(email ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setMsg({ ok: false, text: "Email inválido." });
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: value.trim() });
    setBusy(false);
    if (error) {
      setMsg({
        ok: false,
        text: /registered|exists/i.test(error.message)
          ? "Esse email já está em uso por outra conta."
          : "Não deu pra salvar. Tenta de novo.",
      });
      return;
    }
    setMsg({ ok: true, text: "Enviamos um link de confirmação pro seu email. Abre lá pra confirmar." });
  }

  return (
    <form onSubmit={save} className="mt-10 max-w-md space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg text-ink">EMAIL (OPCIONAL)</h2>
      </div>
      <p className="text-xs text-ink-muted">
        Serve pra recuperar a conta, entrar sem o telefone e receber aviso quando uma carta da sua
        lista de desejo aparecer.
      </p>

      {email && confirmed && !pending && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-teal">
          <BadgeCheck className="h-3.5 w-3.5" /> {email} — confirmado
        </p>
      )}
      {pending && (
        <p className="text-xs font-semibold text-orange-deep">
          Falta confirmar <span className="text-ink">{pending}</span> — abre o link que mandamos por
          email.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="voce@email.com"
        />
        <Button type="submit" variant="outline" disabled={busy || !value.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {email ? "Trocar" : "Adicionar"}
        </Button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-teal" : "text-destructive"}`}>{msg.text}</p>
      )}
    </form>
  );
}

function PasswordSection() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 6) {
      setMsg({ ok: false, text: "A senha precisa ter pelo menos 6 caracteres." });
      return;
    }
    if (pw !== confirm) {
      setMsg({ ok: false, text: "As senhas não coincidem." });
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setMsg({
        ok: false,
        text: error.message.toLowerCase().includes("reauth")
          ? "Por segurança, saia e entre de novo antes de trocar a senha."
          : "Não deu pra trocar a senha. Tenta de novo.",
      });
      return;
    }
    setPw("");
    setConfirm("");
    setMsg({ ok: true, text: "Senha atualizada." });
  }

  return (
    <form onSubmit={handleChange} className="mt-10 max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg text-ink">TROCAR SENHA</h2>
      </div>

      <div className="space-y-1.5">
        <Label>Nova senha</Label>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Pelo menos 6 caracteres"
            className="pr-9"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Esconder senha" : "Mostrar senha"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Confirmar nova senha</Label>
        <Input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repita a senha"
          autoComplete="new-password"
        />
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-teal" : "text-destructive"}`}>{msg.text}</p>
      )}

      <Button type="submit" variant="outline" disabled={busy || !pw}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Trocar senha
      </Button>
    </form>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
