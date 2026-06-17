import { requireRole } from "@/lib/guards"
import { getInvitations, getTeams } from "@/server/data"
import { InvitationsManager } from "@/components/admin/invitations-manager"

export default async function AdminInvitationsPage() {
  await requireRole(["admin"])
  const [invitations, teams] = await Promise.all([getInvitations(), getTeams()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Invitații</h1>
        <p className="text-sm text-muted-foreground">
          Invită colegi în organizație. Linkul de invitație este afișat o singură dată, la creare.
        </p>
      </div>
      <InvitationsManager invitations={invitations} teams={teams} />
    </div>
  )
}
