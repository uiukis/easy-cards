"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectivePermissions } from "@/lib/get-permissions";
import type { UserRole } from "@/lib/supabase/types";

/** Change someone's role. CTO only — this is how permissions are handed out. */
export async function updateUserRole(id: string, role: UserRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "cto") throw new Error("Só o CTO pode alterar cargos.");

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}

/** Mark that a real person was vouched for (or undo it). Requires manage_users. */
export async function setUserVerified(id: string, verified: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me) throw new Error("Sem perfil.");
  const perms = await getEffectivePermissions(supabase, user.id, me.role);
  if (!perms.manage_users) throw new Error("Sem permissão.");

  const { error } = await supabase
    .from("profiles")
    .update({
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verified ? user.id : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/desejos");
}

/** Correct a user's login phone (auth.users + profiles). Requires manage_users. */
export async function updateUserPhone(id: string, rawPhone: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me) throw new Error("Sem perfil.");
  const perms = await getEffectivePermissions(supabase, user.id, me.role);
  if (!perms.manage_users) throw new Error("Sem permissão.");

  let digits = rawPhone.replace(/\D/g, "");
  if (digits && !digits.startsWith("55")) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) throw new Error("Telefone inválido.");

  const admin = createAdminClient();
  const { error: authErr } = await admin.auth.admin.updateUserById(id, {
    phone: digits,
    phone_confirm: true,
  });
  if (authErr) {
    throw new Error(
      /registered|exists|duplicate/i.test(authErr.message)
        ? "Esse número já está em uso por outra conta."
        : authErr.message
    );
  }

  const { error: profErr } = await admin.from("profiles").update({ phone: digits }).eq("id", id);
  if (profErr) throw new Error(profErr.message);

  revalidatePath("/admin/usuarios");
  return { phone: digits };
}
