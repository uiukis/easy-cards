"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { uploadBinderImage } from "@/lib/binder-image";

export type CoverStats = {
  total: number;
  have: number;
  want: number;
  images: number;
  pages: number;
};

export function BinderCover({
  name,
  subtitle,
  imageUrl,
  stats,
  editable = false,
  onSubtitleChange,
  onImageChange,
}: {
  name: string;
  subtitle: string | null;
  imageUrl: string | null;
  stats: CoverStats;
  editable?: boolean;
  onSubtitleChange?: (v: string) => void;
  onImageChange?: (url: string | null) => void;
}) {
  const [editingSub, setEditingSub] = useState(false);
  const [draft, setDraft] = useState(subtitle ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadBinderImage(file);
      onImageChange?.(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não deu pra enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  const cells: { label: string; value: number; tone?: string }[] = [
    { label: "Cartas", value: stats.have },
    { label: "Quero", value: stats.want, tone: "text-orange-deep" },
    { label: "Imagens", value: stats.images },
    { label: "Páginas", value: stats.pages },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-ink/10 bg-surface">
      {/* hero */}
      <div className="relative flex min-h-[220px] flex-col justify-end overflow-hidden bg-halftone p-6 sm:min-h-[280px] sm:p-8">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded cover art */}
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-sunburst" />
        )}

        <div className="relative">
          <h1
            className={`font-display text-3xl leading-tight tracking-wide sm:text-4xl ${
              imageUrl ? "text-white text-comic-shadow-sm" : "text-ink text-comic-shadow-sm"
            }`}
          >
            {name.toUpperCase()}
          </h1>

          {editingSub ? (
            <div className="mt-2 flex items-center gap-1.5">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSubtitleChange?.(draft.trim());
                    setEditingSub(false);
                  }
                  if (e.key === "Escape") setEditingSub(false);
                }}
                placeholder="Um subtítulo pra capa…"
                className="h-8 w-full max-w-xs rounded-lg border-2 border-ink/15 bg-bg px-2.5 text-sm text-ink outline-none focus:border-orange-deep"
              />
              <button
                onClick={() => {
                  onSubtitleChange?.(draft.trim());
                  setEditingSub(false);
                }}
                aria-label="Salvar subtítulo"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-deep text-white"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : subtitle ? (
            <button
              disabled={!editable}
              onClick={() => {
                setDraft(subtitle);
                setEditingSub(true);
              }}
              className={`mt-1.5 text-left text-sm ${imageUrl ? "text-white/90" : "text-ink-muted"} ${
                editable ? "hover:underline" : ""
              }`}
            >
              {subtitle}
              {editable && <Pencil className="ml-1.5 inline h-3 w-3 align-[-1px]" />}
            </button>
          ) : editable ? (
            <button
              onClick={() => {
                setDraft("");
                setEditingSub(true);
              }}
              className={`mt-1.5 inline-flex items-center gap-1 text-sm ${
                imageUrl ? "text-white/80" : "text-ink-muted"
              } hover:underline`}
            >
              <Pencil className="h-3 w-3" /> adicionar subtítulo
            </button>
          ) : null}
        </div>

        {editable && (
          <div className="absolute right-4 top-4 flex gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm hover:bg-black/70"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              {imageUrl ? "trocar" : "imagem"}
            </button>
            {imageUrl && (
              <button
                onClick={() => onImageChange?.(null)}
                aria-label="Remover imagem da capa"
                className="flex items-center justify-center rounded-full bg-black/55 px-2 py-1 text-white backdrop-blur-sm hover:bg-black/70"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 divide-x-2 divide-ink/10 border-t-2 border-ink/10">
        {cells.map((c) => (
          <div key={c.label} className="px-2 py-3 text-center">
            <p className={`font-display text-xl ${c.tone ?? "text-ink"}`}>{c.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              {c.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small dismissable helper for turning the cover on. */
export function CoverToggleHint({ onEnable, onDismiss }: { onEnable: () => void; onDismiss: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-2 border-orange/30 bg-orange/10 px-3 py-2 text-xs text-ink print:hidden">
      <span className="font-semibold text-orange-deep">Nova: capa do fichário</span>
      <span className="text-ink-muted">Uma primeira página com imagem, subtítulo e os números.</span>
      <button onClick={onEnable} className="font-semibold text-primary hover:underline">
        Ativar capa
      </button>
      <button onClick={onDismiss} aria-label="Dispensar" className="ml-auto text-ink-muted hover:text-ink">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
