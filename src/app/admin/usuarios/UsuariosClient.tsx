"use client";

import { useState } from "react";
import { Loader2, Pencil, Check, X, BadgeCheck, ShieldQuestion } from "lucide-react";
import type { Profile, UserRole } from "@/lib/supabase/types";
import type { PermissionKey } from "@/lib/permissions";
import { maskPhoneBR } from "@/lib/phone";
import { updateUserRole, updateUserPhone, setUserVerified } from "./actions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { PokemonAvatar } from "@/components/PokemonAvatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_LABEL: Record<UserRole, string> = {
  cto: "CTO",
  admin: "Admin",
  staff: "Equipe",
  customer: "Cliente",
};

const PERM_SHORT: Record<PermissionKey, string> = {
  view_finance: "Financeiro",
  manage_cards: "Cartas",
  manage_quadro: "Quadro",
  view_users: "Ver usuários",
  manage_users: "Verificar contas",
  view_wishlists: "Listas de desejo",
  manage_auctions: "Leilões",
  view_analytics: "Analytics",
};

export function UsuariosClient({
  profiles,
  currentUserId,
  canEditRoles,
  canManage,
  permsById,
}: {
  profiles: Profile[];
  currentUserId: string;
  canEditRoles: boolean;
  canManage: boolean;
  permsById: Record<string, PermissionKey[]>;
}) {
  const [rows, setRows] = useState(profiles);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [phoneEditId, setPhoneEditId] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);

  async function handleRoleChange(id: string, role: UserRole) {
    setSavingId(id);
    try {
      await updateUserRole(id, role);
      setRows((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    } finally {
      setSavingId(null);
    }
  }

  function startPhoneEdit(p: Profile) {
    setPhoneErr(null);
    setPhoneEditId(p.id);
    setPhoneDraft(maskPhoneBR((p.phone ?? "").replace(/^55/, "")));
  }

  async function savePhone(id: string) {
    setPhoneBusy(true);
    setPhoneErr(null);
    try {
      const res = await updateUserPhone(id, phoneDraft);
      setRows((prev) => prev.map((p) => (p.id === id ? { ...p, phone: res.phone } : p)));
      setPhoneEditId(null);
    } catch (e) {
      setPhoneErr(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setPhoneBusy(false);
    }
  }

  const [verifyBusy, setVerifyBusy] = useState<string | null>(null);
  async function toggleVerified(id: string, next: boolean) {
    setVerifyBusy(id);
    try {
      await setUserVerified(id, next);
      setRows((prev) =>
        prev.map((p) => (p.id === id ? { ...p, verified_at: next ? new Date().toISOString() : null } : p))
      );
    } finally {
      setVerifyBusy(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="USUÁRIOS"
        subtitle={
          canEditRoles
            ? "Controle quem é CTO, admin, equipe ou cliente."
            : canManage
              ? "Você pode ver a lista e verificar contas. Só o CTO altera cargos e permissões."
              : "Você pode ver a lista. Verificar contas e mexer em cargos é com o CTO."
        }
      />

      <ul className="mt-6 space-y-2.5">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-surface p-3"
          >
            <PokemonAvatar sprite={p.favorite_pokemon_sprite} name={p.full_name} size={36} />
            <div className="min-w-0 flex-1 basis-32">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                <span className="truncate">{p.full_name || "—"}</span>
                {p.verified_at ? (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-teal" aria-label="Verificado" />
                ) : (
                  <ShieldQuestion className="h-4 w-4 shrink-0 text-ink-muted/50" aria-label="Não verificado" />
                )}
                {p.id === currentUserId && (
                  <span className="text-xs font-normal text-ink-muted">(você)</span>
                )}
              </p>
              {!canManage ? (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {p.phone ? maskPhoneBR(p.phone.replace(/^55/, "")) : "sem telefone"}
                </p>
              ) : phoneEditId === p.id ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <Input
                    autoFocus
                    inputMode="numeric"
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(maskPhoneBR(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && savePhone(p.id)}
                    className="h-7 max-w-[160px] text-xs"
                  />
                  <button
                    onClick={() => savePhone(p.id)}
                    disabled={phoneBusy}
                    aria-label="Salvar telefone"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-deep text-white"
                  >
                    {phoneBusy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => setPhoneEditId(null)}
                    aria-label="Cancelar"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/20 text-ink-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startPhoneEdit(p)}
                  className="group/ph mt-0.5 flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
                >
                  {p.phone ? maskPhoneBR(p.phone.replace(/^55/, "")) : "sem telefone"}
                  <Pencil className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/ph:opacity-100" />
                </button>
              )}
              {phoneErr && phoneEditId === p.id && (
                <p className="mt-1 text-[11px] text-destructive">{phoneErr}</p>
              )}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {canManage ? (
                <button
                  onClick={() => toggleVerified(p.id, !p.verified_at)}
                  disabled={verifyBusy === p.id || p.id === currentUserId}
                  title={p.verified_at ? "Remover verificação" : "Marcar como verificado"}
                  className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-40 ${
                    p.verified_at
                      ? "border-teal/40 bg-teal/10 text-teal hover:bg-teal/20"
                      : "border-ink/15 text-ink-muted hover:border-teal hover:text-teal"
                  }`}
                >
                  {verifyBusy === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-3.5 w-3.5" />
                  )}
                  {p.verified_at ? "Verificado" : "Verificar"}
                </button>
              ) : (
                <Badge variant={p.verified_at ? "secondary" : "outline"}>
                  {p.verified_at ? "Verificado" : "Não verificado"}
                </Badge>
              )}
              {canEditRoles ? (
                <>
                  <Select
                    value={p.role}
                    disabled={p.id === currentUserId || savingId === p.id}
                    onValueChange={(v) => v && handleRoleChange(p.id, v as UserRole)}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue>{(v: UserRole) => ROLE_LABEL[v]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {savingId === p.id && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted" />
                  )}
                </>
              ) : (
                <Badge variant="secondary">{ROLE_LABEL[p.role]}</Badge>
              )}
            </div>

            {canEditRoles && (
              <div className="basis-full pl-11 text-[11px] text-ink-muted">
                {p.role === "cto" ? (
                  <span className="font-semibold text-teal">Vê tudo (CTO)</span>
                ) : p.role === "customer" ? (
                  <span>Vê só as ferramentas de cliente (fichário, desejos…)</span>
                ) : (permsById[p.id] ?? []).length === 0 ? (
                  <span>Equipe, mas sem nenhuma permissão de painel ligada</span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="mr-0.5">Vê:</span>
                    {(permsById[p.id] ?? []).map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-ink/15 bg-surface-alt px-1.5 py-0.5 font-medium text-ink"
                      >
                        {PERM_SHORT[k]}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
