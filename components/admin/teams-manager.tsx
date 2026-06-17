"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { type Team, type Profile, type TeamMembership } from "@/lib/types"
import {
  createTeamAction,
  deleteTeamAction,
  setTeamMemberAction,
  removeTeamMemberAction,
} from "@/server/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TeamsManager({
  teams,
  profiles,
  memberships,
}: {
  teams: Team[]
  profiles: Profile[]
  memberships: TeamMembership[]
}) {
  const router = useRouter()
  const [newTeam, setNewTeam] = useState("")
  const [addUser, setAddUser] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await action()
      if (!res.ok) toast.error(res.error)
      else {
        toast.success(success)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Creează o echipă</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              placeholder="Nume echipă"
            />
            <Button
              disabled={!newTeam.trim()}
              onClick={() =>
                run(async () => {
                  const r = await createTeamAction({ name: newTeam })
                  if (r.ok) setNewTeam("")
                  return r
                }, "Echipă creată")
              }
            >
              Adaugă
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const members = memberships.filter((m) => m.team_id === team.id)
          const memberIds = new Set(members.map((m) => m.user_id))
          const available = profiles.filter((p) => !memberIds.has(p.id) && p.is_active)
          return (
            <Card key={team.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{team.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => run(() => deleteTeamAction(team.id), "Echipă ștearsă")}
                >
                  Șterge
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Niciun membru</p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((m) => {
                      const profile = profiles.find((p) => p.id === m.user_id)
                      return (
                        <li key={m.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">
                              {profile?.full_name ?? profile?.email ?? "Utilizator"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={m.role_in_team}
                              onValueChange={(v) =>
                                run(
                                  () =>
                                    setTeamMemberAction(team.id, m.user_id, v as "manager" | "member"),
                                  "Rol echipă actualizat",
                                )
                              }
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="member">Membru</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                run(
                                  () => removeTeamMemberAction(team.id, m.user_id),
                                  "Membru eliminat",
                                )
                              }
                            >
                              ✕
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {members.some((m) => m.role_in_team === "manager") ? null : (
                  <Badge variant="outline">Fără manager</Badge>
                )}
                <div className="flex gap-2 pt-2">
                  <Select
                    value={addUser[team.id] ?? ""}
                    onValueChange={(v) => setAddUser((s) => ({ ...s, [team.id]: v ?? "" }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Adaugă membru" />
                    </SelectTrigger>
                    <SelectContent>
                      {available.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Niciun utilizator disponibil
                        </SelectItem>
                      ) : (
                        available.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name ?? p.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!addUser[team.id]}
                    onClick={() =>
                      run(async () => {
                        const r = await setTeamMemberAction(team.id, addUser[team.id], "member")
                        if (r.ok) setAddUser((s) => ({ ...s, [team.id]: "" }))
                        return r
                      }, "Membru adăugat")
                    }
                  >
                    Adaugă
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
