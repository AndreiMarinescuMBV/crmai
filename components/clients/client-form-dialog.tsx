"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { createClientAction, updateClientAction } from "@/server/actions/clients"
import type { Client } from "@/lib/types"

type Props = { client?: Client; trigger?: React.ReactNode }

export function ClientFormDialog({ client, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const editing = Boolean(client)

  function onSubmit(formData: FormData) {
    const input = {
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    }
    startTransition(async () => {
      const res = editing ? await updateClientAction(client!.id, input) : await createClientAction(input)
      if (res.ok) {
        toast.success(editing ? "Client actualizat" : "Client creat")
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
            Client nou
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editează client" : "Client nou"}</DialogTitle>
          <DialogDescription>Completați detaliile clientului.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nume *</Label>
            <Input id="name" name="name" defaultValue={client?.name} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Companie</Label>
              <Input id="company" name="company" defaultValue={client?.company ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industrie</Label>
              <Input id="industry" name="industry" defaultValue={client?.industry ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Se salvează..." : editing ? "Salvează" : "Creează"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
