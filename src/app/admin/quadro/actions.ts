"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/admin/quadro");
  revalidatePath("/");
  revalidatePath("/evento");
  revalidatePath("/apoiador");
  revalidatePath("/imprensa");
}

export async function createSupporter(input: {
  name: string;
  instagram: string;
  image_url: string;
  tier: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("supporters").insert({
    name: input.name,
    instagram: input.instagram || null,
    image_url: input.image_url || null,
    tier: input.tier || null,
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function toggleSupporter(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("supporters").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteSupporter(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("supporters").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export type PressMentionInput = {
  title: string;
  outlet: string;
  outlet_instagram: string;
  journalist: string;
  journalist_instagram: string;
  url: string;
  image_url: string;
  published_date: string;
};

export async function createPressMention(input: PressMentionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("press_mentions").insert({
    title: input.title,
    outlet: input.outlet,
    outlet_instagram: input.outlet_instagram || null,
    journalist: input.journalist || null,
    journalist_instagram: input.journalist_instagram || null,
    url: input.url,
    image_url: input.image_url || null,
    published_date: input.published_date || null,
  });
  if (error) throw new Error(error.message);
  refresh();
}

export async function togglePressMention(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("press_mentions").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deletePressMention(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("press_mentions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
