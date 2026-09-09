import { createClient } from "@/lib/supabase/client";

/** Upload an image for a binder slot to the public `binders` bucket
 *  (works for guests too). Returns the public URL. */
export async function uploadBinderImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Imagem muito grande (máx 5 MB).");
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("binders")
    .upload(path, file, { contentType: file.type || "image/png" });
  if (error) throw error;
  return supabase.storage.from("binders").getPublicUrl(path).data.publicUrl;
}
