"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";
import { updateOwnProfile } from "./actions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PerfilClient({ profile }: { profile: Profile }) {
  const [species, setSpecies] = useState<string[]>([]);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [favoritePokemon, setFavoritePokemon] = useState(profile.favorite_pokemon ?? "");
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
    await updateOwnProfile({ full_name: fullName, favorite_pokemon: favoritePokemon });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <AdminPageHeader title="MEU PERFIL" subtitle={profile.phone ?? undefined} />

      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div className="space-y-1.5">
          <Label>Nome completo</Label>
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
