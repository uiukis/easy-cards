"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Loader2, Trash2 } from "lucide-react";
import { PokemonAvatar } from "@/components/PokemonAvatar";
import { toggleBinderLike, addBinderComment, deleteBinderComment } from "./actions";

export type BinderComment = {
  id: string;
  body: string;
  author_name: string | null;
  author_sprite: string | null;
  created_at: string;
  user_id: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function BinderSocial({
  binderId,
  initialLiked,
  initialLikeCount,
  comments: initialComments,
  currentUserId,
  isOwner,
}: {
  binderId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  comments: BinderComment[];
  currentUserId: string | null;
  isOwner: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loggedIn = currentUserId !== null;

  function like() {
    if (!loggedIn || pending) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      try {
        await toggleBinderLike(binderId);
      } catch {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || pending) return;
    setErr(null);
    startTransition(async () => {
      try {
        await addBinderComment(binderId, body);
        setComments((prev) => [
          ...prev,
          {
            id: `tmp-${Date.now()}`,
            body,
            author_name: "Você",
            author_sprite: null,
            created_at: new Date().toISOString(),
            user_id: currentUserId ?? "",
          },
        ]);
        setDraft("");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Não deu pra comentar.");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      try {
        await deleteBinderComment(id, binderId);
        setComments((prev) => prev.filter((c) => c.id !== id));
      } catch {
        /* ignore */
      }
    });
  }

  return (
    <div className="mx-auto mt-10 max-w-lg border-t-2 border-ink/10 pt-6">
      <div className="flex items-center gap-4">
        <button
          onClick={like}
          disabled={!loggedIn}
          aria-pressed={liked}
          className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
            liked
              ? "border-primary bg-primary/10 text-primary"
              : "border-ink/15 text-ink hover:border-primary hover:text-primary"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
          {likeCount > 0 ? likeCount : ""} {likeCount === 1 ? "curtida" : "curtidas"}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-ink-muted">
          <MessageCircle className="h-4 w-4" />
          {comments.length}
        </span>
      </div>

      {!loggedIn && (
        <p className="mt-3 text-xs text-ink-muted">
          <Link href={`/login?next=/b/${binderId}`} className="font-semibold text-primary hover:underline">
            Entra na sua conta
          </Link>{" "}
          pra curtir e comentar.
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <PokemonAvatar sprite={c.author_sprite} name={c.author_name} size={30} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-ink">{c.author_name ?? "Colecionador"}</span>{" "}
                <span className="text-xs text-ink-muted">{timeAgo(c.created_at)}</span>
              </p>
              <p className="text-sm text-ink">{c.body}</p>
            </div>
            {(isOwner || c.user_id === currentUserId) && !c.id.startsWith("tmp-") && (
              <button
                onClick={() => remove(c.id)}
                aria-label="Apagar comentário"
                className="shrink-0 text-ink-muted/60 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-ink-muted">Ainda sem comentários. Seja o primeiro.</li>
        )}
      </ul>

      {loggedIn && (
        <form onSubmit={submit} className="mt-4 flex items-start gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder="Escreve um comentário…"
            className="flex-1 rounded-xl border-2 border-ink/15 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
          </button>
        </form>
      )}
      {err && <p className="mt-1.5 text-xs text-destructive">{err}</p>}
    </div>
  );
}
