"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, Pencil, Check, X } from "lucide-react";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { maskPhoneBR } from "@/lib/phone";
import { updateUserRole, updateUserPhone } from "./actions";
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

export function UsuariosClient({
  profiles,
  currentUserId,
  canEditRoles,
}: {
  profiles: Profile[];
  currentUserId: string;
  canEditRoles: boolean;
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

  return (
    <div>
      <AdminPageHeader
        title="USUÁRIOS"
        subtitle={
          canEditRoles
            ? "Controle quem é CTO, admin, equipe ou cliente."
            : "Só o CTO pode alterar permissões de usuários."
        }
      />

      {canEditRoles && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            O cadastro não confirma o número por SMS (é assim que fica de graça). Antes de promover
            alguém pra Admin ou Equipe, confirme com a pessoa por um canal que você já confia (o
            WhatsApp de sempre, por exemplo) que foi ela mesma quem criou a conta com aquele número.
          </p>
        </div>
      )}

      <ul className="mt-6 space-y-2.5">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-surface p-3"
          >
            <PokemonAvatar sprite={p.favorite_pokemon_sprite} name={p.full_name} size={36} />
            <div className="min-w-0 flex-1 basis-32">
              <p className="truncate text-sm font-semibold text-ink">
                {p.full_name || "—"}
                {p.id === currentUserId && (
                  <span className="ml-2 text-xs font-normal text-ink-muted">(você)</span>
                )}
              </p>
              {phoneEditId === p.id ? (
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
          </li>
        ))}
      </ul>
    </div>
  );
}
