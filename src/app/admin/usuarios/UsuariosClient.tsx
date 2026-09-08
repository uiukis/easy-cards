"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { updateUserRole } from "./actions";

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Dono",
  staff: "Equipe",
  customer: "Cliente",
};

export function UsuariosClient({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(profiles);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleRoleChange(id: string, role: UserRole) {
    setSavingId(id);
    try {
      await updateUserRole(id, role);
      setRows((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">USUÁRIOS</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Controle quem é dono, equipe ou cliente.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border-2 border-ink/10 bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink/10 text-xs font-semibold text-ink-muted">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Telefone</th>
              <th className="px-5 py-3">Permissão</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-3 font-semibold text-ink">
                  {p.full_name || "—"}
                  {p.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-ink-muted">(você)</span>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-muted">{p.phone}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={p.role}
                      disabled={p.id === currentUserId || savingId === p.id}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                      className="rounded-lg border-2 border-ink/10 bg-bg px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-orange-deep disabled:opacity-50"
                    >
                      {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </select>
                    {savingId === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
