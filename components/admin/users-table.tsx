"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { type Profile, type AppRole, ROLE_LABEL } from "@/lib/types"
import { setUserRoleAction, setUserActiveAction } from "@/server/actions/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function UsersTable({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function changeRole(userId: string, role: AppRole) {
    setPendingId(userId)
    startTransition(async () => {
      const res = await setUserRoleAction(userId, role)
      setPendingId(null)
      if (!res.ok) toast.error(res.error)
      else {
        toast.success("Rol actualizat")
        router.refresh()
      }
    })
  }

  function toggleActive(userId: string, isActive: boolean) {
    setPendingId(userId)
    startTransition(async () => {
      const res = await setUserActiveAction(userId, isActive)
      setPendingId(null)
      if (!res.ok) toast.error(res.error)
      else {
        toast.success(isActive ? "Utilizator activat" : "Utilizator dezactivat")
        router.refresh()
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilizator</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => {
          const isSelf = u.id === currentUserId
          return (
            <TableRow key={u.id}>
              <TableCell>
                <div className="font-medium text-foreground">{u.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </TableCell>
              <TableCell>
                <Select
                  value={u.role}
                  disabled={isSelf || pendingId === u.id}
                  onValueChange={(v) => changeRole(u.id, v as AppRole)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{ROLE_LABEL.admin}</SelectItem>
                    <SelectItem value="manager">{ROLE_LABEL.manager}</SelectItem>
                    <SelectItem value="agent">{ROLE_LABEL.agent}</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {u.is_active ? (
                  <Badge variant="secondary">Activ</Badge>
                ) : (
                  <Badge variant="outline">Inactiv</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSelf || pendingId === u.id}
                  onClick={() => toggleActive(u.id, !u.is_active)}
                >
                  {u.is_active ? "Dezactivează" : "Activează"}
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
