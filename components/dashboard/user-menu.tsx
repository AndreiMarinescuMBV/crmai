"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signOutAction } from "@/server/actions/session"
import { ROLE_LABEL, type AppRole } from "@/lib/types"

type Props = { fullName: string | null; email: string; role: AppRole; tenantName: string }

export function UserMenu({ fullName, email, role, tenantName }: Props) {
  const [pending, startTransition] = useTransition()
  const initials = (fullName || email).slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium">{fullName || "Utilizator"}</span>
          <span className="text-xs font-normal text-muted-foreground">{email}</span>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>
            <span className="truncate text-xs text-muted-foreground">{tenantName}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault()
            startTransition(() => {
              void signOutAction()
            })
          }}
        >
          <LogOut className="mr-2 size-4" />
          Deconectare
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
