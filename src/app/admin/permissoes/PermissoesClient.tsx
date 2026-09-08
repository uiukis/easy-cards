"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, Lock, UserCog } from "lucide-react";
import { PERMISSION_LABEL, resolvePermissions, type PermissionKey } from "@/lib/permissions";
import type { UserRole } from "@/lib/supabase/types";
import { setPermission, setUserPermission, clearUserPermission } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoleRow = { role: string; permission_key: string; allowed: boolean };
type UserRow = { user_id: string; permission_key: string; allowed: boolean };
type Profile = { id: string; full_name: string | null; phone: string | null; role: UserRole };

const ROLES: { role: UserRole; label: string }[] = [
  { role: "admin", label: "Admin (Bão / Emanoel)" },
  { role: "staff", label: "Equipe" },
];

const ROLE_LABEL: Record<UserRole, string> = {
  cto: "CTO",
  admin: "Admin",
  staff: "Equipe",
  customer: "Cliente",
};

const PERMISSION_KEYS = Object.keys(PERMISSION_LABEL) as PermissionKey[];

export function PermissoesClient({
  rows,
  profiles,
  userRows,
}: {
  rows: RoleRow[];
  profiles: Profile[];
  userRows: UserRow[];
}) {
  const [matrix, setMatrix] = useState(() => {
    const m: Record<string, boolean> = {};
    for (const r of rows) m[`${r.role}:${r.permission_key}`] = r.allowed;
    return m;
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [overrides, setOverrides] = useState(() => {
    const m: Record<string, boolean> = {};
    for (const r of userRows) m[`${r.user_id}:${r.permission_key}`] = r.allowed;
    return m;
  });
  const [selectedUserId, setSelectedUserId] = useState<string>(profiles[0]?.id ?? "");
  const [savingUserKey, setSavingUserKey] = useState<string | null>(null);

  async function toggleRole(role: UserRole, key: PermissionKey) {
    const cellKey = `${role}:${key}`;
    const next = !matrix[cellKey];
    setSavingKey(cellKey);
    setMatrix((prev) => ({ ...prev, [cellKey]: next }));
    try {
      await setPermission(role, key, next);
    } catch {
      setMatrix((prev) => ({ ...prev, [cellKey]: !next }));
    } finally {
      setSavingKey(null);
    }
  }

  const selectedProfile = profiles.find((p) => p.id === selectedUserId);
  const roleDefaults = selectedProfile
    ? resolvePermissions(selectedProfile.role, rows)
    : null;

  async function toggleUser(key: PermissionKey, currentEffective: boolean) {
    const cellKey = `${selectedUserId}:${key}`;
    const next = !currentEffective;
    setSavingUserKey(cellKey);
    setOverrides((prev) => ({ ...prev, [cellKey]: next }));
    try {
      await setUserPermission(selectedUserId, key, next);
    } finally {
      setSavingUserKey(null);
    }
  }

  async function resetUser(key: PermissionKey) {
    const cellKey = `${selectedUserId}:${key}`;
    setSavingUserKey(cellKey);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[cellKey];
      return next;
    });
    try {
      await clearUserPermission(selectedUserId, key);
    } finally {
      setSavingUserKey(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl text-ink">PERMISSÕES</h1>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Só o CTO vê essa página. Controla o que admin e equipe podem acessar.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permissão (padrão do papel)</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r.role}>{r.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_KEYS.map((key) => (
              <TableRow key={key}>
                <TableCell className="text-ink">{PERMISSION_LABEL[key]}</TableCell>
                {ROLES.map((r) => {
                  const cellKey = `${r.role}:${key}`;
                  const allowed = matrix[cellKey] ?? false;
                  return (
                    <TableCell key={r.role}>
                      <ToggleCell
                        allowed={allowed}
                        saving={savingKey === cellKey}
                        onClick={() => toggleRole(r.role, key)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-10 flex items-center gap-2">
        <UserCog className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl text-ink">POR PESSOA</h2>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Ajusta uma pessoa específica sem mudar o padrão do papel dela — ex: alguém da equipe que só
        deve mexer no quadro, não em cartas.
      </p>

      {profiles.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Ninguém além do CTO cadastrado ainda.</p>
      ) : (
        <div className="mt-4 max-w-lg">
          <Select value={selectedUserId} onValueChange={(v) => v && setSelectedUserId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  selectedProfile
                    ? `${selectedProfile.full_name || selectedProfile.phone} — ${ROLE_LABEL[selectedProfile.role]}`
                    : "Selecione"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name || p.phone} — {ROLE_LABEL[p.role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProfile && roleDefaults && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
              <Table>
                <TableBody>
                  {PERMISSION_KEYS.map((key) => {
                    const cellKey = `${selectedUserId}:${key}`;
                    const hasOverride = cellKey in overrides;
                    const effective = hasOverride ? overrides[cellKey] : roleDefaults[key];
                    return (
                      <TableRow key={key}>
                        <TableCell className="text-ink">
                          {PERMISSION_LABEL[key]}
                          {hasOverride && (
                            <span className="ml-2 text-[10px] font-semibold uppercase text-primary">
                              personalizado
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ToggleCell
                            allowed={effective}
                            saving={savingUserKey === cellKey}
                            onClick={() => toggleUser(key, effective)}
                          />
                        </TableCell>
                        <TableCell>
                          {hasOverride && (
                            <button
                              type="button"
                              onClick={() => resetUser(key)}
                              className="text-xs font-semibold text-ink-muted underline"
                            >
                              usar padrão do papel
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ToggleCell({
  allowed,
  saving,
  onClick,
}: {
  allowed: boolean;
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        disabled={saving}
        className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors disabled:opacity-60 ${
          allowed ? "bg-teal justify-end" : "bg-ink/15 justify-start"
        }`}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <span className="h-5 w-5 rounded-full bg-white shadow" />
        )}
      </button>
    </div>
  );
}
