"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getTenantContext } from "@/lib/guards"
import { type ActionResult, ok, fail } from "@/lib/action-result"
import { dealSchema, changeStageSchema } from "@/lib/validation/schemas"
import { logAudit } from "@/lib/audit"

export async function createDealAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = dealSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide")

  const ctx = await getTenantContext()
  const supabase = await createClient()

  // Inherit the client's team so manager scoping stays consistent.
  const { data: client } = await supabase
    .from("clients")
    .select("team_id")
    .eq("id", parsed.data.client_id)
    .maybeSingle()

  const { data, error } = await supabase
    .from("deals")
    .insert({
      tenant_id: ctx.tenantId,
      owner_id: ctx.userId,
      client_id: parsed.data.client_id,
      title: parsed.data.title,
      value_ron: parsed.data.value_ron,
      stage: parsed.data.stage ?? "lead",
      expected_close_date: parsed.data.expected_close_date || null,
      team_id: parsed.data.team_id || client?.team_id || null,
    })
    .select("id")
    .single()

  if (error) return fail(error.message)
  await logAudit(ctx, "deal.create", "deal", data.id)
  revalidatePath("/dashboard/deals")
  revalidatePath("/dashboard")
  return ok({ id: data.id })
}

export async function updateDealAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = dealSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide")

  await getTenantContext()
  const supabase = await createClient()
  const { error } = await supabase
    .from("deals")
    .update({
      title: parsed.data.title,
      client_id: parsed.data.client_id,
      value_ron: parsed.data.value_ron,
      expected_close_date: parsed.data.expected_close_date || null,
      team_id: parsed.data.team_id || null,
    })
    .eq("id", id)

  if (error) return fail(error.message)
  revalidatePath("/dashboard/deals")
  revalidatePath(`/dashboard/deals/${id}`)
  return ok(undefined)
}

/**
 * Stage change with optimistic concurrency check.
 * 1. Zod validates the transition is allowed (from_stage → to_stage)
 * 2. Server verifies the deal is still in from_stage (concurrency guard)
 * 3. DB trigger provides the ultimate enforcement
 * 4. DB CHECK enforces lost_reason when stage = 'lost'
 * 5. DB trigger auto-logs to deal_stage_history
 */
export async function changeStageAction(input: unknown): Promise<ActionResult> {
  const parsed = changeStageSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide")

  const ctx = await getTenantContext()
  const supabase = await createClient()

  // Optimistic concurrency: verify the deal is still in the expected from_stage.
  const { data: current } = await supabase
    .from("deals")
    .select("stage")
    .eq("id", parsed.data.deal_id)
    .maybeSingle()

  if (!current) return fail("Oportunitatea nu a fost găsită")
  if (current.stage !== parsed.data.from_stage) {
    return fail(`Oportunitatea a fost modificată între timp (stagiu actual: ${current.stage})`)
  }

  const { error } = await supabase
    .from("deals")
    .update({
      stage: parsed.data.to_stage,
      lost_reason: parsed.data.to_stage === "lost" ? parsed.data.lost_reason : null,
    })
    .eq("id", parsed.data.deal_id)

  if (error) return fail(error.message)
  await logAudit(ctx, "deal.stage_change", "deal", parsed.data.deal_id, {
    from: parsed.data.from_stage,
    to: parsed.data.to_stage,
  })
  revalidatePath("/dashboard/deals")
  revalidatePath(`/dashboard/deals/${parsed.data.deal_id}`)
  revalidatePath("/dashboard")
  return ok(undefined)
}

export async function deleteDealAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext()
  const supabase = await createClient()
  const { error } = await supabase.from("deals").delete().eq("id", id)
  if (error) return fail(error.message)
  await logAudit(ctx, "deal.delete", "deal", id)
  revalidatePath("/dashboard/deals")
  return ok(undefined)
}
