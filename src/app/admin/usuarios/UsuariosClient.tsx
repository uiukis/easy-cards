"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { updateUserRole } from "./actions";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Permissão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold text-ink">
                  {p.full_name || "—"}
                  {p.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-ink-muted">(você)</span>
                  )}
                </TableCell>
                <TableCell className="text-ink-muted">{p.phone}</TableCell>
                <TableCell>
                  {canEditRoles ? (
                    <div className="flex items-center gap-2">
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
                    </div>
                  ) : (
                    <Badge variant="secondary">{ROLE_LABEL[p.role]}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
