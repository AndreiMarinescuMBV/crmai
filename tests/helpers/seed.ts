/**
 * Test data seeding utilities.
 *
 * Creates controlled multi-tenant, multi-team fixtures using the
 * Supabase service-role client. Each call to `seedTestWorld()` creates
 * a self-contained test environment with two tenants and multiple roles.
 *
 * IMPORTANT: This file is only used in tests. Never import it in production.
 */

import { randomUUID } from "crypto"
import { createServiceClient } from "./supabase-as"

const TEST_PASSWORD = "TestPassword123!"
const now = () => new Date().toISOString()

export type TestUser = {
  id: string
  email: string
  password: string
  tenantId: string
  role: "admin" | "manager" | "agent"
  teamId?: string
}

export type TestWorld = {
  tenantA: {
    id: string
    admin: TestUser
    manager: TestUser
    agent1: TestUser
    agent2: TestUser
    teamId: string
  }
  tenantB: {
    id: string
    admin: TestUser
    agent: TestUser
    teamId: string
  }
}

/**
 * Seeds a complete test world with 2 tenants, teams, and users.
 *
 * Tenant A: admin, manager (manages teamA), agent1 (in teamA), agent2 (no team)
 * Tenant B: admin, agent (in teamB)
 */
export async function seedTestWorld(testRunId: string): Promise<TestWorld> {
  const admin = createServiceClient()

  // --- Tenant A ---
  const tenantAId = randomUUID()
  const { data: tenantA, error: tenantAError } = await admin
    .from("tenants")
    .insert({ id: tenantAId, name: `TestTenantA_${testRunId}`, created_at: now() })
    .select("id")
    .single()
  if (tenantAError || !tenantA) throw new Error(`Failed to create Tenant A: ${tenantAError?.message ?? "no data"}`)

  const teamAId = randomUUID()
  const { data: teamA, error: teamAError } = await admin
    .from("teams")
    .insert({ id: teamAId, tenant_id: tenantA.id, name: `TeamA_${testRunId}`, created_at: now() })
    .select("id")
    .single()
  if (teamAError || !teamA) throw new Error(`Failed to create Team A: ${teamAError?.message ?? "no data"}`)

  const adminA = await createTestUser(admin, {
    email: `admin-a-${testRunId}@test.local`,
    tenantId: tenantA.id,
    role: "admin",
  })

  const managerA = await createTestUser(admin, {
    email: `manager-a-${testRunId}@test.local`,
    tenantId: tenantA.id,
    role: "manager",
    teamId: teamA.id,
    teamRole: "manager",
  })

  const agent1A = await createTestUser(admin, {
    email: `agent1-a-${testRunId}@test.local`,
    tenantId: tenantA.id,
    role: "agent",
    teamId: teamA.id,
    teamRole: "member",
  })

  const agent2A = await createTestUser(admin, {
    email: `agent2-a-${testRunId}@test.local`,
    tenantId: tenantA.id,
    role: "agent",
  })

  // --- Tenant B ---
  const tenantBId = randomUUID()
  const { data: tenantB, error: tenantBError } = await admin
    .from("tenants")
    .insert({ id: tenantBId, name: `TestTenantB_${testRunId}`, created_at: now() })
    .select("id")
    .single()
  if (tenantBError || !tenantB) throw new Error(`Failed to create Tenant B: ${tenantBError?.message ?? "no data"}`)

  const teamBId = randomUUID()
  const { data: teamB, error: teamBError } = await admin
    .from("teams")
    .insert({ id: teamBId, tenant_id: tenantB.id, name: `TeamB_${testRunId}`, created_at: now() })
    .select("id")
    .single()
  if (teamBError || !teamB) throw new Error(`Failed to create Team B: ${teamBError?.message ?? "no data"}`)

  const adminB = await createTestUser(admin, {
    email: `admin-b-${testRunId}@test.local`,
    tenantId: tenantB.id,
    role: "admin",
  })

  const agentB = await createTestUser(admin, {
    email: `agent-b-${testRunId}@test.local`,
    tenantId: tenantB.id,
    role: "agent",
    teamId: teamB.id,
    teamRole: "member",
  })

  return {
    tenantA: {
      id: tenantA.id,
      admin: adminA,
      manager: managerA,
      agent1: agent1A,
      agent2: agent2A,
      teamId: teamA.id,
    },
    tenantB: {
      id: tenantB.id,
      admin: adminB,
      agent: agentB,
      teamId: teamB.id,
    },
  }
}

/**
 * Creates a test user via Supabase Auth admin API and inserts a profile.
 */
async function createTestUser(
  serviceClient: ReturnType<typeof createServiceClient>,
  opts: {
    email: string
    tenantId: string
    role: "admin" | "manager" | "agent"
    teamId?: string
    teamRole?: "manager" | "member"
  },
): Promise<TestUser> {
  // Create auth user
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: opts.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    app_metadata: { tenant_id: opts.tenantId, role: opts.role },
  })
  if (authError || !authData.user) {
    throw new Error(`Failed to create user ${opts.email}: ${authError?.message}`)
  }

  // Create profile
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: authData.user.id,
    tenant_id: opts.tenantId,
    email: opts.email,
    role: opts.role,
    is_active: true,
    created_at: now(),
  })
  if (profileError) {
    throw new Error(`Failed to create profile for ${opts.email}: ${profileError.message}`)
  }

  // Add to team if specified
  if (opts.teamId) {
    const { error: memberError } = await serviceClient.from("team_memberships").insert({
      id: randomUUID(),
      tenant_id: opts.tenantId,
      team_id: opts.teamId,
      user_id: authData.user.id,
      role_in_team: opts.teamRole ?? "member",
      created_at: now(),
    })
    if (memberError) {
      throw new Error(`Failed to add ${opts.email} to team: ${memberError.message}`)
    }
  }

  return {
    id: authData.user.id,
    email: opts.email,
    password: TEST_PASSWORD,
    tenantId: opts.tenantId,
    role: opts.role,
    teamId: opts.teamId,
  }
}

/**
 * Cleans up all test data created by a specific test run.
 * Deletes in reverse dependency order to avoid FK violations.
 */
export async function cleanupTestWorld(world: TestWorld) {
  const admin = createServiceClient()
  const tenantIds = [world.tenantA.id, world.tenantB.id]

  // Delete CRM data (reverse dependency order)
  for (const tid of tenantIds) {
    await admin.from("deal_stage_history").delete().eq("tenant_id", tid)
    await admin.from("activities").delete().eq("tenant_id", tid)
    await admin.from("deals").delete().eq("tenant_id", tid)
    await admin.from("contacts").delete().eq("tenant_id", tid)
    await admin.from("clients").delete().eq("tenant_id", tid)
    await admin.from("team_memberships").delete().eq("tenant_id", tid)
    await admin.from("teams").delete().eq("tenant_id", tid)
    await admin.from("invitations").delete().eq("tenant_id", tid)
    await admin.from("profiles").delete().eq("tenant_id", tid)
    await admin.from("tenants").delete().eq("id", tid)
  }

  // Delete auth users
  const allUsers = [
    world.tenantA.admin,
    world.tenantA.manager,
    world.tenantA.agent1,
    world.tenantA.agent2,
    world.tenantB.admin,
    world.tenantB.agent,
  ]
  for (const u of allUsers) {
    await admin.auth.admin.deleteUser(u.id)
  }
}
