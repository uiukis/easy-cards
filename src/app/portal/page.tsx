import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Landing spot right after login/signup: sends staff+ to the admin panel
// and everyone else to their own purchase history.
export default async function PortalRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile && profile.role !== "customer") {
    redirect("/admin");
  }
  redirect("/minhas-cartas");
}
