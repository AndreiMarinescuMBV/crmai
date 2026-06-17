import Link from "next/link"
import { getClients } from "@/server/data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientFormDialog } from "@/components/clients/client-form-dialog"
import { Building2, ChevronRight } from "lucide-react"

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clienți</h1>
          <p className="text-sm text-muted-foreground">{clients.length} clienți în portofoliu</p>
        </div>
        <ClientFormDialog />
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nu aveți încă clienți.</p>
            <ClientFormDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/dashboard/clients/${c.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="flex items-start justify-between gap-3 p-5">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium">{c.name}</p>
                    {c.company && <p className="truncate text-sm text-muted-foreground">{c.company}</p>}
                    {c.industry && (
                      <Badge variant="secondary" className="mt-1">
                        {c.industry}
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
