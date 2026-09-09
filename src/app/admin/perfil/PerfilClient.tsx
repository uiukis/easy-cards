"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Eye, EyeOff, KeyRound, Phone } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { maskPhoneBR, toE164BR } from "@/lib/phone";
import { updateOwnProfile } from "./actions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { PokemonAvatar } from "@/components/PokemonAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PerfilClient({ profile }: { profile: Profile }) {
  const [species, setSpecies] = useState<string[]>([]);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const initialPhone = maskPhoneBR((profile.phone ?? "").replace(/^55/, ""));
  const [phone, setPhone] = useState(initialPhone);
  const [favoritePokemon, setFavoritePokemon] = useState(profile.favorite_pokemon ?? "");
  const [sprite, setSprite] = useState(profile.favorite_pokemon_sprite);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

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
    setPhoneError(null);

    const phoneDigits = phone.replace(/\D/g, "");
    const originalDigits = initialPhone.replace(/\D/g, "");
    const phoneChanged = phoneDigits !== originalDigits;

    if (phoneChanged) {
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        setPhoneError("Telefone inválido. Use DDD + número.");
        setSaving(false);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ phone: toE164BR(phone) });
      if (error) {
        setPhoneError(
          error.message.toLowerCase().includes("reauth")
            ? "Por segurança, saia e entre de novo antes de trocar o telefone."
            : error.message.toLowerCase().includes("registered") ||
                error.message.toLowerCase().includes("exists")
              ? "Esse número já está em uso por outra conta."
              : "Não deu pra atualizar o telefone. Confira o número."
        );
        setSaving(false);
        return;
      }
    }

    const res = await updateOwnProfile({
      full_name: fullName,
      favorite_pokemon: favoritePokemon,
      phone: phoneChanged ? phoneDigits : undefined,
    });
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
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Telefone (usado pra entrar)
          </Label>
          <Input
            inputMode="numeric"
            placeholder="(85) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
          />
          {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
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

      <PasswordSection />
    </div>
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
