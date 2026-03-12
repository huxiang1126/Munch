import { getAuthenticatedUser } from "@/lib/auth";
import { ensureFallbackAdminUser } from "@/lib/admin-fallback";
import { isLocalSuperAdminEmail } from "@/lib/local-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const user = await getAuthenticatedUser();
    if (user && isLocalSuperAdminEmail(user.email)) {
      ensureFallbackAdminUser(user);
      return { user, supabase: null };
    }

    throw new Error("Not authorized");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const authenticatedUser = await getAuthenticatedUser();

    if (authenticatedUser && isLocalSuperAdminEmail(authenticatedUser.email)) {
      ensureFallbackAdminUser(authenticatedUser);
      return { user: authenticatedUser, supabase: null };
    }

    throw new Error("Not authenticated");
  }

  if (isLocalSuperAdminEmail(user.email)) {
    return { user, supabase };
  }

  throw new Error("Not authorized");
}
