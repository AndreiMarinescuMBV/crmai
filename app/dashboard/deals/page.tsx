import Link from "next/link"
import { getDeals, getClients } from "@/server/data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DealFormDialog } from "@/components/deals/deal-form-dialog"
import { formatRON } from "@/lib/money"
import { STAGE_LABEL } from "@/lib/types"

export default async function DealsPage() {
  const [deals, clients] = await Promise.all([getDeals(), getClients()])
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Oportunități</h1>
          <p className="text-sm text-muted-foreground">{deals.length} oportunități</p>
        </div>
        <DealFormDialog clients={clientOptions} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titlu</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Etapă</TableHead>
              <TableHead className="text-right">Valoare</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((d) => (
              <TableRow key={d.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/dashboard/deals/${d.id}`} className="hover:underline">
                    {d.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.client?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{STAGE_LABEL[d.stage]}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatRON(d.value_ron)}</TableCell>
              </TableRow>
            ))}
            {deals.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Nicio oportunitate. Creați prima oportunitate.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
