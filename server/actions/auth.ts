"use server"

import { createClient } from "@/lib/supabase/server"
import { type ActionResult, ok, fail } from "@/lib/action-result"

/** Creates the tenant + admin profile for the first signed-in user. */
export async function bootstrapTenantAction(tenantName: string, fullName: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail("Sesiune lipsă. Autentificați-vă din nou.")

  const { error } = await supabase.rpc("bootstrap_tenant", {
    p_tenant_name: tenantName,
    p_full_name: fullName,
  })
  if (error) return fail(error.message)
  return ok(undefined)
}

/** Accepts an invitation token for the signed-in user. */
export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail("Sesiune lipsă. Autentificați-vă din nou.")

  const { error } = await supabase.rpc("accept_invitation", { p_token: token })
  if (error) return fail(error.message)
  return ok(undefined)
}
