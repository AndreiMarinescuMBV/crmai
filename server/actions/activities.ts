"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getTenantContext } from "@/lib/guards"
import { type ActionResult, ok, fail } from "@/lib/action-result"
import { activitySchema } from "@/lib/validation/schemas"

export async function createActivityAction(input: unknown): Promise<ActionResult> {
  const parsed = activitySchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide")

  const ctx = await getTenantContext()
  const supabase = await createClient()

  // Resolve team_id from the related deal/client for scoping.
  let teamId: string | null = null
  if (parsed.data.deal_id) {
    const { data } = await supabase.from("deals").select("team_id").eq("id", parsed.data.deal_id).maybeSingle()
    teamId = data?.team_id ?? null
  } else if (parsed.data.client_id) {
    const { data } = await supabase.from("clients").select("team_id").eq("id", parsed.data.client_id).maybeSingle()
    teamId = data?.team_id ?? null
  }

  const { error } = await supabase.from("activities").insert({
    tenant_id: ctx.tenantId,
    owner_id: ctx.userId,
    team_id: teamId,
    type: parsed.data.type,
    subject: parsed.data.subject,
    body: parsed.data.body || null,
    deal_id: parsed.data.deal_id || null,
    client_id: parsed.data.client_id || null,
    occurred_at: parsed.data.occurred_at || new Date().toISOString(),
  })

  if (error) return fail(error.message)
  if (parsed.data.deal_id) revalidatePath(`/dashboard/deals/${parsed.data.deal_id}`)
  if (parsed.data.client_id) revalidatePath(`/dashboard/clients/${parsed.data.client_id}`)
  revalidatePath("/dashboard")
  return ok(undefined)
}

export async function deleteActivityAction(
  id: string,
  ctx: { dealId?: string; clientId?: string },
): Promise<ActionResult> {
  await getTenantContext()
  const supabase = await createClient()
  const { error } = await supabase.from("activities").delete().eq("id", id)
  if (error) return fail(error.message)
  if (ctx.dealId) revalidatePath(`/dashboard/deals/${ctx.dealId}`)
  if (ctx.clientId) revalidatePath(`/dashboard/clients/${ctx.clientId}`)
  return ok(undefined)
}
