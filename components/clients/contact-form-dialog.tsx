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
import { Plus } from "lucide-react"
import { upsertContactAction } from "@/server/actions/clients"
import type { Contact } from "@/lib/types"

type Props = { clientId: string; contact?: Contact; trigger?: React.ReactNode }

export function ContactFormDialog({ clientId, contact, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const editing = Boolean(contact)

  function onSubmit(formData: FormData) {
    const input = {
      client_id: clientId,
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      position: String(formData.get("position") ?? ""),
      is_primary: formData.get("is_primary") === "on",
    }
    startTransition(async () => {
      const res = await upsertContactAction(input, contact?.id)
      if (res.ok) {
        toast.success(editing ? "Contact actualizat" : "Contact adăugat")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) ?? (
            <Button variant="outline" size="sm">
              <Plus className="mr-2 size-4" />
              Contact
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editează contact" : "Contact nou"}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nume complet *</Label>
            <Input id="full_name" name="full_name" defaultValue={contact?.full_name} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Funcție</Label>
            <Input id="position" name="position" defaultValue={contact?.position ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_primary"
              defaultChecked={contact?.is_primary}
              className="size-4 rounded border-input"
            />
            Contact principal
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Se salvează..." : "Salvează"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
