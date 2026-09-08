import { createClient } from "@/lib/supabase/server";
import { UsuariosClient } from "./UsuariosClient";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return <UsuariosClient profiles={profiles ?? []} currentUserId={user!.id} />;
}
