import { requireRole } from "@/lib/guards"
import { getProfiles } from "@/server/data"
import { UsersTable } from "@/components/admin/users-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminUsersPage() {
  const ctx = await requireRole(["admin"])
  const users = await getProfiles()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Utilizatori</h1>
        <p className="text-sm text-muted-foreground">
          Gestionează rolurile și accesul membrilor organizației.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membri ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} currentUserId={ctx.userId} />
        </CardContent>
      </Card>
    </div>
  )
}
