/**
 * Test helper: creates Supabase clients that impersonate specific test users.
 *
 * Uses the service-role client to generate JWTs with custom claims
 * (tenant_id, role) so tests can assert RLS visibility per role.
 *
 * IMPORTANT: This file is only used in tests. Never import it in production.
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Service-role client — bypasses RLS. Only for test setup/teardown. */
export function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Creates a Supabase client that acts as a specific user.
 * Signs in with the user's email + password, returning an RLS-bound client.
 */
export async function createClientAs(email: string, password: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Failed to sign in as ${email}: ${error.message}`)

  return client
}
