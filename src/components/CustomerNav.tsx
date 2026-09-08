import { createClient } from "@/lib/supabase/server";
import { CustomerNavClient } from "./CustomerNavClient";

// Server wrapper: figures out whether the viewer is staff so the client nav
// can offer a way back into the admin panel.
export async function CustomerNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isStaff = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStaff = !!profile && profile.role !== "customer";
  }

  return <CustomerNavClient isStaff={isStaff} />;
}
