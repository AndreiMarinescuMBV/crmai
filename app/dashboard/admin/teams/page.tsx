import { requireRole } from "@/lib/guards"
import { getTeams, getProfiles, getTeamMemberships } from "@/server/data"
import { TeamsManager } from "@/components/admin/teams-manager"
import type { TeamMembership } from "@/lib/types"

export default async function AdminTeamsPage() {
  await requireRole(["admin"])
  const [teams, profiles, memberships] = await Promise.all([
    getTeams(),
    getProfiles(),
    getTeamMemberships(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Echipe</h1>
        <p className="text-sm text-muted-foreground">
          Organizează utilizatorii în echipe. Fiecare echipă poate avea un singur manager.
        </p>
      </div>
      <TeamsManager
        teams={teams}
        profiles={profiles}
        memberships={memberships as TeamMembership[]}
      />
    </div>
  )
}
