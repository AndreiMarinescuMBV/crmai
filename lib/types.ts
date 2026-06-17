import type { DealStage } from "@/lib/validation/schemas"

export type AppRole = "admin" | "manager" | "agent"
export type TeamRole = "manager" | "member"
export type ActivityType = "call" | "meeting" | "note"
export type { DealStage }

export type Profile = {
  id: string
  tenant_id: string
  email: string
  full_name: string | null
  role: AppRole
  is_active: boolean
  created_at: string
}

export type Tenant = {
  id: string
  name: string
  created_at: string
}

export type Team = {
  id: string
  tenant_id: string
  name: string
  created_at: string
}

export type TeamMembership = {
  id: string
  tenant_id: string
  team_id: string
  user_id: string
  role_in_team: TeamRole
  created_at: string
}

export type Invitation = {
  id: string
  tenant_id: string
  email: string
  role: AppRole
  team_id: string | null
  status: "pending" | "accepted" | "revoked" | "expired"
  invited_by: string | null
  expires_at: string
  created_at: string
}

export type Client = {
  id: string
  tenant_id: string
  owner_id: string
  team_id: string | null
  name: string
  company: string | null
  industry: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Contact = {
  id: string
  tenant_id: string
  client_id: string
  full_name: string
  email: string | null
  phone: string | null
  position: string | null
  is_primary: boolean
  created_at: string
}

export type Deal = {
  id: string
  tenant_id: string
  owner_id: string
  team_id: string | null
  client_id: string
  title: string
  value_ron: string
  stage: DealStage
  lost_reason: string | null
  expected_close_date: string | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export type Activity = {
  id: string
  tenant_id: string
  owner_id: string
  team_id: string | null
  deal_id: string | null
  client_id: string | null
  type: ActivityType
  subject: string
  body: string | null
  occurred_at: string
  created_at: string
}

export const DEAL_STAGES: { value: DealStage; label: string }[] = [
  { value: "lead", label: "Prospect" },
  { value: "contacted", label: "Contactat" },
  { value: "offer_sent", label: "Ofertă trimisă" },
  { value: "won", label: "Câștigat" },
  { value: "lost", label: "Pierdut" },
]

export const STAGE_LABEL: Record<DealStage, string> = {
  lead: "Prospect",
  contacted: "Contactat",
  offer_sent: "Ofertă trimisă",
  won: "Câștigat",
  lost: "Pierdut",
}

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  agent: "Agent",
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  call: "Apel",
  meeting: "Întâlnire",
  note: "Notiță",
}
