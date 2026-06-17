export type AppRole = "admin" | "manager" | "agent"

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  agent: "Agent",
}

export function canManageUsers(role: AppRole): boolean {
  return role === "admin"
}

export function canManageTeams(role: AppRole): boolean {
  return role === "admin"
}

export function canInvite(role: AppRole): boolean {
  return role === "admin"
}
