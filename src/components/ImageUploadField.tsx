"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

/** Upload an image to the public `quadro` bucket, or paste a URL. */
export function ImageUploadField({
  value,
  onChange,
  shape = "circle",
}: {
  value: string;
  onChange: (url: string) => void;
  shape?: "circle" | "square";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const round = shape === "circle" ? "rounded-full" : "rounded-lg";

  async function handleFile(file: File) {
    setErr(null);
    if (file.size > 5 * 1024 * 1024) {
      setErr("Imagem muito grande (máx 5 MB).");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${crypto.randomUUID()}.${ext || "png"}`;
      const { error } = await supabase.storage
        .from("quadro")
        .upload(path, file, { contentType: file.type || "image/png" });
      if (error) throw error;
      const { data } = supabase.storage.from("quadro").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setErr("Não deu pra enviar. Tenta de novo ou cola uma URL.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary URL
          <img
            src={value}
            alt=""
            className={`h-14 w-14 shrink-0 border-2 border-ink/10 object-cover ${round}`}
          />
        ) : (
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center border-2 border-dashed border-ink/15 text-ink-muted ${round}`}
          >
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {value ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] text-ink-muted hover:text-ink"
            >
              remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <Input
        placeholder="…ou cola a URL da imagem"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
