"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { createActivityAction } from "@/server/actions/activities"
import type { ActivityType } from "@/lib/types"

type Props = { dealId?: string; clientId?: string }

export function ActivityComposer({ dealId, clientId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState<ActivityType>("note")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  function submit() {
    if (!subject.trim()) {
      toast.error("Subiectul este obligatoriu")
      return
    }
    startTransition(async () => {
      const res = await createActivityAction({ type, subject, body, deal_id: dealId, client_id: clientId })
      if (res.ok) {
        toast.success("Activitate înregistrată")
        setSubject("")
        setBody("")
        setType("note")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <div className="space-y-1.5">
            <Label className="text-xs">Tip</Label>
            <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Notiță</SelectItem>
                <SelectItem value="call">Apel</SelectItem>
                <SelectItem value="meeting">Întâlnire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subiect</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Apel de follow-up" />
          </div>
        </div>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Detalii (opțional)" rows={2} />
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending ? "Se salvează..." : "Adaugă activitate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
