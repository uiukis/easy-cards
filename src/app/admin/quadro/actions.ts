"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/admin/quadro");
  revalidatePath("/");
  revalidatePath("/evento");
  revalidatePath("/apoiador");
}

export type EventSettingsInput = {
  title: string;
  event_date: string;
  place: string;
  tag: string;
  banner_enabled: boolean;
  banner_message: string;
  form_url: string;
};

export async function updateEventSettings(input: EventSettingsInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_settings")
    .update({
      title: input.title,
      event_date: input.event_date || null,
      place: input.place || null,
      tag: input.tag || null,
      banner_enabled: input.banner_enabled,
      banner_message: input.banner_message || null,
      form_url: input.form_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) throw new Error(error.message);
  refresh();
}

export async function createAnnouncement(message: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({ message });
  if (error) throw new Error(error.message);
  refresh();
}

export async function toggleAnnouncement(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
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
