import { createClient } from "./server";

/**
 * Get the authenticated user in API routes.
 * Returns the user and supabase client, or null user with error.
 * Always use this in API routes — don't rely solely on middleware.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, error: "Unauthorized" } as const;
  }

  return { user, supabase, error: null } as const;
}
