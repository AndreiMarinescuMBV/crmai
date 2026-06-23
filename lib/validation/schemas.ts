import { z } from "zod"

export const dealStages = ["lead", "contacted", "offer_sent", "won", "lost"] as const
export type DealStage = (typeof dealStages)[number]

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  contacted: "Contactat",
  offer_sent: "Ofertă trimisă",
  won: "Câștigat",
  lost: "Pierdut",
}

// Allowed forward transitions (UI mirror of the DB trigger)
export const STAGE_TRANSITIONS: Record<DealStage, DealStage[]> = {
  lead: ["contacted", "lost"],
  contacted: ["offer_sent", "lost"],
  offer_sent: ["won", "lost"],
  won: [],
  lost: [],
}

export function canTransition(from: DealStage, to: DealStage): boolean {
  if (from === to) return true
  return STAGE_TRANSITIONS[from].includes(to)
}

export const clientSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu").max(200),
  company: z.string().max(200).optional().or(z.literal("")),
  industry: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  team_id: z.string().uuid().optional().or(z.literal("")),
})
export type ClientInput = z.infer<typeof clientSchema>

export const contactSchema = z.object({
  client_id: z.string().uuid(),
  full_name: z.string().min(1, "Numele este obligatoriu").max(200),
  email: z.string().email("Email invalid").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  position: z.string().max(120).optional().or(z.literal("")),
  is_primary: z.boolean().optional(),
})
export type ContactInput = z.infer<typeof contactSchema>

export const dealSchema = z.object({
  title: z.string().min(1, "Titlul este obligatoriu").max(200),
  client_id: z.string().uuid("Selectați un client"),
  value_ron: z.coerce.number().min(0, "Valoarea nu poate fi negativă"),
  stage: z.enum(dealStages).optional(),
  expected_close_date: z.string().optional().or(z.literal("")),
  team_id: z.string().uuid().optional().or(z.literal("")),
})
export type DealInput = z.infer<typeof dealSchema>

/**
 * Stage change schema with `from_stage` for optimistic concurrency safety.
 * The server verifies that the deal is still in `from_stage` before applying
 * the transition. The DB trigger provides the ultimate enforcement.
 */
export const changeStageSchema = z
  .object({
    deal_id: z.string().uuid(),
    from_stage: z.enum(dealStages),
    to_stage: z.enum(dealStages),
    lost_reason: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((d) => canTransition(d.from_stage, d.to_stage), {
    message: "Tranziție de stagiu invalidă",
    path: ["to_stage"],
  })
  .refine((d) => d.to_stage !== "lost" || (d.lost_reason && d.lost_reason.trim().length > 0), {
    message: "Motivul pierderii este obligatoriu",
    path: ["lost_reason"],
  })
export type ChangeStageInput = z.infer<typeof changeStageSchema>

/**
 * Activity schema with built-in refinement: at least one of deal_id or
 * client_id must be provided. Previously checked in the action; now shared
 * for client/server validation.
 */
export const activitySchema = z
  .object({
    type: z.enum(["call", "meeting", "note"]),
    subject: z.string().min(1, "Subiectul este obligatoriu").max(200),
    body: z.string().max(2000).optional().or(z.literal("")),
    deal_id: z.string().uuid().optional().or(z.literal("")),
    client_id: z.string().uuid().optional().or(z.literal("")),
    occurred_at: z.string().optional().or(z.literal("")),
  })
  .refine((d) => !!(d.deal_id || d.client_id), {
    message: "Activitatea trebuie legată de un client sau o oportunitate",
    path: ["deal_id"],
  })
export type ActivityInput = z.infer<typeof activitySchema>

export const inviteSchema = z.object({
  email: z.string().email("Email invalid"),
  role: z.enum(["admin", "manager", "agent"]),
  team_id: z.string().uuid().optional().or(z.literal("")),
})
export type InviteInput = z.infer<typeof inviteSchema>

export const teamSchema = z.object({
  name: z.string().min(1, "Numele echipei este obligatoriu").max(120),
})
export type TeamInput = z.infer<typeof teamSchema>
