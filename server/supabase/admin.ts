import { createClient } from "@supabase/supabase-js"

/**
 * Admin client that uses the service role key. This bypasses RLS and should
 * only be used in trusted server-side contexts (server actions, API routes,
 * background jobs). Never expose this client to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
