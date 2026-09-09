import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PerfilClient } from "./PerfilClient";

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/admin");

  return (
    <PerfilClient
      profile={profile}
      email={user.email ?? null}
      emailConfirmed={!!user.email_confirmed_at}
      pendingEmail={(user as { new_email?: string }).new_email ?? null}
    />
  );
}
