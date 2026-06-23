import type { TenantContext } from "@/lib/guards"

/**
 * Typed audit actions for sensitive CRM operations.
 * Console-only for MVP — call sites are established so a persistent
 * `audit_log` table can be plugged in later without changing action code.
 */
export type AuditAction =
  | "client.create"
  | "client.delete"
  | "deal.create"
  | "deal.delete"
  | "deal.stage_change"

export async function logAudit(
  ctx: TenantContext,
  action: AuditAction,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>,
): Promise<void> {
  console.info(
    `[AUDIT] tenant=${ctx.tenantId} user=${ctx.userId} action=${action} entity=${entityType}:${entityId}`,
    details ?? "",
  )
}
