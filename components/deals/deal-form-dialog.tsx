"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createDealAction, updateDealAction } from "@/server/actions/deals"
import type { Deal } from "@/lib/types"

type ClientOption = { id: string; name: string }
type Props = { clients: ClientOption[]; deal?: Deal; defaultClientId?: string; trigger?: React.ReactNode }

export function DealFormDialog({ clients, deal, defaultClientId, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [clientId, setClientId] = useState(deal?.client_id ?? defaultClientId ?? "")
  const editing = Boolean(deal)

  function onSubmit(formData: FormData) {
    const input = {
      title: String(formData.get("title") ?? ""),
      client_id: clientId,
      value_ron: Number(formData.get("value_ron") ?? 0),
      expected_close_date: String(formData.get("expected_close_date") ?? ""),
    }
    startTransition(async () => {
      const res = editing ? await updateDealAction(deal!.id, input) : await createDealAction(input)
      if (res.ok) {
        toast.success(editing ? "Oportunitate actualizată" : "Oportunitate creată")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 size-4" />
            Oportunitate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editează oportunitate" : "Oportunitate nouă"}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titlu *</Label>
            <Input id="title" name="title" defaultValue={deal?.title} required />
          </div>
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={clientId} onValueChange={setClientId} disabled={Boolean(defaultClientId)}>
              <SelectTrigger>
                <SelectValue placeholder="Selectați un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="value_ron">Valoare (RON)</Label>
              <Input
                id="value_ron"
                name="value_ron"
                type="number"
                min="0"
                step="100"
                defaultValue={deal?.value_ron ?? "0"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Dată estimată închidere</Label>
              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                defaultValue={deal?.expected_close_date ?? ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !clientId}>
              {pending ? "Se salvează..." : editing ? "Salvează" : "Creează"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
