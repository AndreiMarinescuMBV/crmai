/**
 * CRM Isolation Test Suite — Plan 04
 *
 * Verifies:
 *   1. Tenant isolation  — no cross-tenant data leakage
 *   2. Role visibility   — agent/manager/admin see correct rows
 *   3. Business rules    — pipeline transitions, lost_reason, auto-timestamps
 *   4. Write permissions — owner-only mutations, FK restrictions
 *
 * Prerequisites:
 *   - Supabase local/dev instance running with migrations applied
 *   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *     SUPABASE_SERVICE_ROLE_KEY environment variables set
 *   - Test runner configured (e.g., Vitest)
 *
 * Run: pnpm test tests/crm-isolation.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { seedTestWorld, cleanupTestWorld, type TestWorld } from "./helpers/seed"
import { createClientAs, createServiceClient } from "./helpers/supabase-as"

let world: TestWorld
const RUN_ID = `t${Date.now()}`

beforeAll(async () => {
  world = await seedTestWorld(RUN_ID)
}, 30_000)

afterAll(async () => {
  if (world) await cleanupTestWorld(world)
}, 30_000)

// ==========================================================================
//  1. TENANT ISOLATION
// ==========================================================================

describe("Tenant isolation", () => {
  it("Agent in Tenant A cannot see clients from Tenant B", async () => {
    const serviceClient = createServiceClient()
    // Seed a client in Tenant B
    await serviceClient.from("clients").insert({
      tenant_id: world.tenantB.id,
      owner_id: world.tenantB.agent.id,
      team_id: world.tenantB.teamId,
      name: `TenantB_Client_${RUN_ID}`,
    })

    // Agent1 in Tenant A queries clients
    const clientA = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { data } = await clientA.from("clients").select("*")
    const tenantBClients = (data ?? []).filter((c: { tenant_id: string }) => c.tenant_id === world.tenantB.id)
    expect(tenantBClients).toHaveLength(0)
  })

  it("Cross-tenant insert is rejected by RLS", async () => {
    const clientA = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await clientA.from("clients").insert({
      tenant_id: world.tenantB.id, // Wrong tenant!
      owner_id: world.tenantA.agent1.id,
      name: "Should fail",
    })
    expect(error).not.toBeNull()
  })

  it("Admin in Tenant A cannot see deals from Tenant B", async () => {
    const serviceClient = createServiceClient()
    const { data: client } = await serviceClient
      .from("clients")
      .insert({
        tenant_id: world.tenantB.id,
        owner_id: world.tenantB.agent.id,
        name: `TenantB_DealClient_${RUN_ID}`,
      })
      .select("id")
      .single()

    await serviceClient.from("deals").insert({
      tenant_id: world.tenantB.id,
      owner_id: world.tenantB.agent.id,
      client_id: client!.id,
      title: `TenantB_Deal_${RUN_ID}`,
      value_ron: 1000,
    })

    const adminA = await createClientAs(world.tenantA.admin.email, world.tenantA.admin.password)
    const { data: deals } = await adminA.from("deals").select("*")
    const tenantBDeals = (deals ?? []).filter((d: { tenant_id: string }) => d.tenant_id === world.tenantB.id)
    expect(tenantBDeals).toHaveLength(0)
  })
})

// ==========================================================================
//  2. ROLE VISIBILITY
// ==========================================================================

describe("Role visibility", () => {
  let testClientId: string

  beforeAll(async () => {
    const serviceClient = createServiceClient()
    // Create a client owned by agent1 in teamA
    const { data } = await serviceClient
      .from("clients")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        name: `RoleTest_Client_${RUN_ID}`,
      })
      .select("id")
      .single()
    testClientId = data!.id
  })

  it("Agent sees only their own clients", async () => {
    const agent1 = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { data } = await agent1.from("clients").select("id, owner_id")
    const allOwned = (data ?? []).every((c: { owner_id: string }) => c.owner_id === world.tenantA.agent1.id)
    expect(allOwned).toBe(true)
  })

  it("Agent2 (no team) cannot see agent1's team-scoped client", async () => {
    const agent2 = await createClientAs(world.tenantA.agent2.email, world.tenantA.agent2.password)
    const { data } = await agent2.from("clients").select("id").eq("id", testClientId)
    expect(data).toHaveLength(0)
  })

  it("Manager sees all clients in their managed team", async () => {
    const manager = await createClientAs(world.tenantA.manager.email, world.tenantA.manager.password)
    const { data } = await manager.from("clients").select("id").eq("id", testClientId)
    expect(data).toHaveLength(1)
  })

  it("Admin sees all clients in tenant", async () => {
    const admin = await createClientAs(world.tenantA.admin.email, world.tenantA.admin.password)
    const { data } = await admin.from("clients").select("id").eq("id", testClientId)
    expect(data).toHaveLength(1)
  })

  it("Contact visibility follows parent client", async () => {
    const serviceClient = createServiceClient()
    await serviceClient.from("contacts").insert({
      tenant_id: world.tenantA.id,
      client_id: testClientId,
      full_name: `Contact_${RUN_ID}`,
      is_primary: true,
    })

    // Agent2 cannot see the contact (because they can't see the client)
    const agent2 = await createClientAs(world.tenantA.agent2.email, world.tenantA.agent2.password)
    const { data } = await agent2.from("contacts").select("*").eq("client_id", testClientId)
    expect(data).toHaveLength(0)

    // Manager can see it
    const manager = await createClientAs(world.tenantA.manager.email, world.tenantA.manager.password)
    const { data: mgrData } = await manager.from("contacts").select("*").eq("client_id", testClientId)
    expect(mgrData!.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
//  3. BUSINESS CONSTRAINTS
// ==========================================================================

describe("Business constraints", () => {
  let testDealId: string
  let testClientId: string

  beforeAll(async () => {
    const serviceClient = createServiceClient()
    const { data: client } = await serviceClient
      .from("clients")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        name: `BizRule_Client_${RUN_ID}`,
      })
      .select("id")
      .single()
    testClientId = client!.id

    const { data: deal } = await serviceClient
      .from("deals")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        client_id: testClientId,
        title: `BizRule_Deal_${RUN_ID}`,
        value_ron: 5000,
        stage: "lead",
      })
      .select("id")
      .single()
    testDealId = deal!.id
  })

  it("rejects invalid stage transition (lead → won)", async () => {
    const agent = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await agent.from("deals").update({ stage: "won" }).eq("id", testDealId)
    expect(error).not.toBeNull()
    // Trigger fires with Romanian message; assert it's present
    expect(error!.message.toLowerCase()).toContain("tranzi")
  })

  it("allows valid stage transition (lead → contacted)", async () => {
    const agent = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await agent.from("deals").update({ stage: "contacted" }).eq("id", testDealId)
    expect(error).toBeNull()
  })

  it("rejects lost without lost_reason (CHECK constraint)", async () => {
    // Deal is now in 'contacted' from previous test
    const agent = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await agent.from("deals").update({ stage: "lost" }).eq("id", testDealId)
    expect(error).not.toBeNull()
  })

  it("allows lost with lost_reason", async () => {
    const agent = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await agent
      .from("deals")
      .update({ stage: "lost", lost_reason: "Buget insuficient" })
      .eq("id", testDealId)
    expect(error).toBeNull()
  })

  it("rejects transition out of terminal state (lost → contacted)", async () => {
    const agent = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await agent.from("deals").update({ stage: "contacted" }).eq("id", testDealId)
    expect(error).not.toBeNull()
    expect(error!.message.toLowerCase()).toContain("tranzi")
  })

  it("auto-populates deal_stage_history on stage change", async () => {
    const serviceClient = createServiceClient()
    const { data: history } = await serviceClient
      .from("deal_stage_history")
      .select("*")
      .eq("deal_id", testDealId)
      .order("changed_at", { ascending: true })

    expect(history!.length).toBeGreaterThanOrEqual(2) // lead→contacted, contacted→lost
    expect(history![0].from_stage).toBe("lead")
    expect(history![0].to_stage).toBe("contacted")
  })

  it("auto-updates last_activity_at when activity is created", async () => {
    const serviceClient = createServiceClient()

    // Create a new deal for this test (not in terminal state)
    const { data: deal } = await serviceClient
      .from("deals")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        client_id: testClientId,
        title: `ActivityTimestamp_Deal_${RUN_ID}`,
        value_ron: 1000,
        stage: "lead",
      })
      .select("id, last_activity_at")
      .single()

    const originalTimestamp = deal!.last_activity_at

    // Insert an activity with a future occurred_at
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    await serviceClient.from("activities").insert({
      tenant_id: world.tenantA.id,
      owner_id: world.tenantA.agent1.id,
      team_id: world.tenantA.teamId,
      deal_id: deal!.id,
      type: "note",
      subject: "Test activity",
      occurred_at: futureDate,
    })

    const { data: updated } = await serviceClient
      .from("deals")
      .select("last_activity_at")
      .eq("id", deal!.id)
      .single()

    expect(new Date(updated!.last_activity_at).getTime()).toBeGreaterThan(new Date(originalTimestamp).getTime())
  })

  it("rejects client deletion when child deals exist (RESTRICT)", async () => {
    const serviceClient = createServiceClient()
    const { error } = await serviceClient.from("clients").delete().eq("id", testClientId)
    expect(error).not.toBeNull()
    expect(error!.message).toContain("foreign key")
  })
})

// ==========================================================================
//  4. WRITE PERMISSIONS
// ==========================================================================

describe("Write permissions", () => {
  it("agent cannot update another agent's client", async () => {
    const serviceClient = createServiceClient()
    const { data: client } = await serviceClient
      .from("clients")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        name: `WriteTest_Client_${RUN_ID}`,
      })
      .select("id")
      .single()

    // Agent2 tries to update agent1's client
    const agent2 = await createClientAs(world.tenantA.agent2.email, world.tenantA.agent2.password)
    const { data, error } = await agent2
      .from("clients")
      .update({ name: "Hijacked!" })
      .eq("id", client!.id)
      .select("id")

    // RLS should prevent the update — either error or 0 rows affected
    expect(data?.length ?? 0).toBe(0)
  })

  it("manager can update data within their team", async () => {
    const serviceClient = createServiceClient()
    const { data: client } = await serviceClient
      .from("clients")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        name: `MgrUpdate_Client_${RUN_ID}`,
      })
      .select("id")
      .single()

    const manager = await createClientAs(world.tenantA.manager.email, world.tenantA.manager.password)
    const { data, error } = await manager
      .from("clients")
      .update({ name: `MgrUpdated_${RUN_ID}` })
      .eq("id", client!.id)
      .select("id")

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it("deal_stage_history manual INSERT is rejected for regular users", async () => {
    const agent = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await agent.from("deal_stage_history").insert({
      tenant_id: world.tenantA.id,
      deal_id: "00000000-0000-0000-0000-000000000000",
      from_stage: "lead",
      to_stage: "contacted",
      changed_by: world.tenantA.agent1.id,
      changed_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })

  it("owner can delete their own deal (CASCADE deletes activities)", async () => {
    const serviceClient = createServiceClient()
    const { data: client } = await serviceClient
      .from("clients")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        name: `CascadeTest_Client_${RUN_ID}`,
      })
      .select("id")
      .single()

    const { data: deal } = await serviceClient
      .from("deals")
      .insert({
        tenant_id: world.tenantA.id,
        owner_id: world.tenantA.agent1.id,
        team_id: world.tenantA.teamId,
        client_id: client!.id,
        title: `CascadeTest_Deal_${RUN_ID}`,
        value_ron: 1000,
        stage: "lead",
      })
      .select("id")
      .single()

    // Add an activity to the deal
    await serviceClient.from("activities").insert({
      tenant_id: world.tenantA.id,
      owner_id: world.tenantA.agent1.id,
      team_id: world.tenantA.teamId,
      deal_id: deal!.id,
      type: "note",
      subject: "Will be cascaded",
      occurred_at: new Date().toISOString(),
    })

    // Agent1 deletes the deal — activities should CASCADE
    const agent = await createClientAs(world.tenantA.agent1.email, world.tenantA.agent1.password)
    const { error } = await agent.from("deals").delete().eq("id", deal!.id)
    expect(error).toBeNull()

    // Verify activities were cascaded
    const { data: remainingActivities } = await serviceClient
      .from("activities")
      .select("id")
      .eq("deal_id", deal!.id)
    expect(remainingActivities).toHaveLength(0)
  })
})
