import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://easycardstcg.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/cartas",
    "/leiloes",
    "/evento",
    "/imprensa",
    "/novidades",
    "/apoiador",
    "/fichario",
  ].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: (p === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  // shared binders + public collector profiles
  const supabase = await createClient();
  const [{ data: binders }, { data: profiles }] = await Promise.all([
    supabase.from("binders").select("id").eq("share_enabled", true).limit(500),
    supabase.from("profiles").select("username").eq("wishlist_public", true).not("username", "is", null).limit(500),
  ]);

  const dynamic = [
    ...(binders ?? []).map((b) => ({ url: `${BASE}/b/${b.id}`, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...(profiles ?? []).map((p) => ({ url: `${BASE}/u/${p.username}`, changeFrequency: "weekly" as const, priority: 0.4 })),
  ];

  return [...staticPages, ...dynamic];
}
