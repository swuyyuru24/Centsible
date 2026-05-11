import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDemoClient } from "@/lib/demo/mock-client";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function createClient(): SupabaseClient {
  if (IS_DEMO) {
    return createDemoClient() as unknown as SupabaseClient;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
