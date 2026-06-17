"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { type Invitation, type Team, type AppRole, ROLE_LABEL } from "@/lib/types"
import { createInvitationAction, revokeInvitationAction } from "@/server/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_LABEL: Record<Invitation["status"], string> = {
  pending: "În așteptare",
  accepted: "Acceptată",
  revoked: "Revocată",
  expired: "Expirată",
}

export function InvitationsManager({
  invitations,
  teams,
}: {
  invitations: Invitation[]
  teams: Team[]
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AppRole>("agent")
  const [teamId, setTeamId] = useState<string>("none")
  const [isPending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const res = await createInvitationAction({
        email,
        role,
        team_id: teamId === "none" ? undefined : teamId,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const link = `${window.location.origin}${res.data.link}`
      await navigator.clipboard.writeText(link).catch(() => {})
      toast.success("Invitație creată. Linkul a fost copiat în clipboard.")
      setEmail("")
      router.refresh()
    })
  }

  function revoke(id: string) {
    startTransition(async () => {
      const res = await revokeInvitationAction(id)
      if (!res.ok) toast.error(res.error)
      else {
        toast.success("Invitație revocată")
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trimite o invitație</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="inv-email">Email</Label>
              <Input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coleg@firma.ro"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">{ROLE_LABEL.agent}</SelectItem>
                  <SelectItem value="manager">{ROLE_LABEL.manager}</SelectItem>
                  <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Echipă (opțional)</Label>
              <Select value={teamId} onValueChange={(v) => setTeamId(v ?? "none")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără echipă</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={submit} disabled={isPending || !email}>
              Creează invitație
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitații ({invitations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nicio invitație trimisă
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-foreground">{inv.email}</TableCell>
                    <TableCell>{ROLE_LABEL[inv.role]}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "pending" ? "secondary" : "outline"}>
                        {STATUS_LABEL[inv.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "pending" ? (
                        <Button variant="outline" size="sm" onClick={() => revoke(inv.id)}>
                          Revocă
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
