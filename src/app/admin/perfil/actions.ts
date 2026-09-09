"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Best-effort PokéAPI lookup for the sprite that becomes the person's avatar. */
async function resolvePokemonSprite(name: string): Promise<string | null> {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!slug) return null;
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
    if (!res.ok) return null;
    const d = await res.json();
    return (
      d?.sprites?.other?.["official-artwork"]?.front_default ??
      d?.sprites?.other?.home?.front_default ??
      d?.sprites?.front_default ??
      null
    );
  } catch {
    return null;
  }
}

export async function updateOwnProfile(input: {
  full_name: string;
  favorite_pokemon: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const fav = input.favorite_pokemon.trim();

  // Only re-hit PokéAPI when the favourite actually changed.
  const { data: current } = await supabase
    .from("profiles")
    .select("favorite_pokemon, favorite_pokemon_sprite, verified_at")
    .eq("id", user.id)
    .single();

  let sprite = current?.favorite_pokemon_sprite ?? null;
  const changed = fav.toLowerCase() !== (current?.favorite_pokemon ?? "").toLowerCase();
  if (fav && (changed || !sprite)) {
    sprite = await resolvePokemonSprite(fav);
  } else if (!fav) {
    sprite = null;
  }

  const patch: Record<string, unknown> = {
    favorite_pokemon: fav || null,
    favorite_pokemon_sprite: fav ? sprite : null,
  };
  // A verified name is locked — only the team changes it (keeps the ✓ honest).
  if (!current?.verified_at) patch.full_name = input.full_name;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/perfil");
  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  return { sprite: fav ? sprite : null };
}

/** Claim or change the public handle used at /u/<username>. */
export async function setUsername(raw: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const username = raw.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { ok: false as const, error: "Use 3 a 20 letras, números ou _ (sem espaço)." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false as const,
      error: /duplicate|unique/i.test(error.message)
        ? "Esse nome de usuário já está em uso."
        : "Não deu pra salvar.",
    };
  }
  revalidatePath("/admin/perfil");
  revalidatePath("/lista-de-desejos");
  return { ok: true as const, username };
}
