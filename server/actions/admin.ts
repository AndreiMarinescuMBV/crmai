"use server"

import { randomBytes, createHash } from "crypto"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/guards"
import { type ActionResult, ok, fail } from "@/lib/action-result"
import { inviteSchema, teamSchema } from "@/lib/validation/schemas"

/* ---------------- Teams ---------------- */

export async function createTeamAction(input: unknown): Promise<ActionResult> {
  const parsed = teamSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide")

  const ctx = await requireRole(["admin"])
  const supabase = await createClient()
  const { error } = await supabase.from("teams").insert({ name: parsed.data.name, tenant_id: ctx.tenantId })
  if (error) return fail(error.message)
  revalidatePath("/dashboard/admin/teams")
  return ok(undefined)
}

export async function deleteTeamAction(id: string): Promise<ActionResult> {
  await requireRole(["admin"])
  const supabase = await createClient()
  const { error } = await supabase.from("teams").delete().eq("id", id)
  if (error) return fail(error.message)
  revalidatePath("/dashboard/admin/teams")
  return ok(undefined)
}

export async function setTeamMemberAction(
  teamId: string,
  userId: string,
  roleInTeam: "manager" | "member",
): Promise<ActionResult> {
  const ctx = await requireRole(["admin"])
  const supabase = await createClient()
  const { error } = await supabase
    .from("team_memberships")
    .upsert(
      { team_id: teamId, user_id: userId, role_in_team: roleInTeam, tenant_id: ctx.tenantId },
      { onConflict: "team_id,user_id" },
    )
  if (error) return fail(error.message)
  revalidatePath("/dashboard/admin/teams")
  return ok(undefined)
}

export async function removeTeamMemberAction(teamId: string, userId: string): Promise<ActionResult> {
  await requireRole(["admin"])
  const supabase = await createClient()
  const { error } = await supabase.from("team_memberships").delete().eq("team_id", teamId).eq("user_id", userId)
  if (error) return fail(error.message)
  revalidatePath("/dashboard/admin/teams")
  return ok(undefined)
}

/* ---------------- Users / Roles ---------------- */

export async function setUserRoleAction(userId: string, role: "admin" | "manager" | "agent"): Promise<ActionResult> {
  await requireRole(["admin"])
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_member_role", { p_user_id: userId, p_role: role })
  if (error) return fail(error.message)
  revalidatePath("/dashboard/admin/users")
  return ok(undefined)
}

export async function setUserActiveAction(userId: string, isActive: boolean): Promise<ActionResult> {
  await requireRole(["admin"])
  const supabase = await createClient()
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId)
  if (error) return fail(error.message)
  revalidatePath("/dashboard/admin/users")
  return ok(undefined)
}

/* ---------------- Invitations ---------------- */

export async function createInvitationAction(
  input: unknown,
): Promise<ActionResult<{ token: string; link: string }>> {
  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide")

  const ctx = await requireRole(["admin"])
  const supabase = await createClient()

  // Reject if a profile already exists for this email in the tenant.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", parsed.data.email.toLowerCase())
    .maybeSingle()
  if (existing) return fail("Există deja un utilizator cu acest email")

  const token = randomBytes(24).toString("hex")
  const tokenHash = createHash("sha256").update(token).digest("hex")

  const { error } = await supabase.from("invitations").insert({
    tenant_id: ctx.tenantId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    team_id: parsed.data.team_id || null,
    token_hash: tokenHash,
    invited_by: ctx.userId,
  })
  if (error) return fail(error.message)

  revalidatePath("/dashboard/admin/invitations")
  const link = `/accept-invite?token=${token}`
  return ok({ token, link })
}

export async function revokeInvitationAction(id: string): Promise<ActionResult> {
  await requireRole(["admin"])
  const supabase = await createClient()
  const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id)
  if (error) return fail(error.message)
  revalidatePath("/dashboard/admin/invitations")
  return ok(undefined)
}
