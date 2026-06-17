"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { changeStageAction } from "@/server/actions/deals"
import { STAGE_LABEL, type DealStage } from "@/lib/types"
import { STAGE_TRANSITIONS } from "@/lib/validation/schemas"

export function StageChanger({ dealId, current }: { dealId: string; current: DealStage }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [lostOpen, setLostOpen] = useState(false)
  const [lostReason, setLostReason] = useState("")
  const next = STAGE_TRANSITIONS[current]

  function move(to: DealStage) {
    if (to === "lost") {
      setLostOpen(true)
      return
    }
    startTransition(async () => {
      const res = await changeStageAction({ deal_id: dealId, to_stage: to })
      if (res.ok) {
        toast.success(`Mutat în „${STAGE_LABEL[to]}”`)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function confirmLost() {
    if (!lostReason.trim()) {
      toast.error("Motivul pierderii este obligatoriu")
      return
    }
    startTransition(async () => {
      const res = await changeStageAction({ deal_id: dealId, to_stage: "lost", lost_reason: lostReason })
      if (res.ok) {
        toast.success("Oportunitate marcată ca pierdută")
        setLostOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  if (next.length === 0) {
    return <p className="text-sm text-muted-foreground">Etapă finală — nu sunt tranziții disponibile.</p>
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {next.map((to) => (
          <Button
            key={to}
            size="sm"
            variant={to === "lost" ? "outline" : "default"}
            disabled={pending}
            onClick={() => move(to)}
          >
            {to === "lost" ? "Marchează pierdut" : `Mută în „${STAGE_LABEL[to]}”`}
          </Button>
        ))}
      </div>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivul pierderii</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="lost_reason">De ce a fost pierdută oportunitatea? *</Label>
            <Textarea
              id="lost_reason"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              rows={3}
              placeholder="Ex: Preț prea mare, a ales un concurent..."
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmLost} disabled={pending}>
              Confirmă pierderea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
