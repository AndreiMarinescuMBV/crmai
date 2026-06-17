import { createClient } from "@/lib/supabase/server"
import type { Client, Deal, Profile, Team, Activity, Invitation, Contact } from "@/lib/types"

/**
 * All reads go through the RLS-protected anon/auth client, so results are
 * automatically scoped to the caller's tenant and role. No manual tenant
 * filtering is required here, but we keep ordering deterministic.
 */

export async function getDeals(): Promise<(Deal & { client: { name: string } | null })[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("deals")
    .select("*, client:clients(name)")
    .order("last_activity_at", { ascending: false })
  return (data as never) ?? []
}

export async function getDealById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("deals")
    .select("*, client:clients(id, name, company)")
    .eq("id", id)
    .maybeSingle()
  return data as (Deal & { client: { id: string; name: string; company: string | null } | null }) | null
}

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false })
  return (data as Client[]) ?? []
}

export async function getClientById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle()
  return data as Client | null
}

export async function getContactsForClient(clientId: string): Promise<Contact[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
  return (data as Contact[]) ?? []
}

export async function getDealsForClient(clientId: string): Promise<Deal[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
  return (data as Deal[]) ?? []
}

export async function getActivities(filter: { dealId?: string; clientId?: string }): Promise<Activity[]> {
  const supabase = await createClient()
  let q = supabase.from("activities").select("*").order("occurred_at", { ascending: false })
  if (filter.dealId) q = q.eq("deal_id", filter.dealId)
  if (filter.clientId) q = q.eq("client_id", filter.clientId)
  const { data } = await q
  return (data as Activity[]) ?? []
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })
  return (data as Profile[]) ?? []
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("teams").select("*").order("created_at", { ascending: true })
  return (data as Team[]) ?? []
}

export async function getTeamMemberships() {
  const supabase = await createClient()
  const { data } = await supabase.from("team_memberships").select("*")
  return data ?? []
}

export async function getInvitations(): Promise<Invitation[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("invitations").select("*").order("created_at", { ascending: false })
  return (data as Invitation[]) ?? []
}
