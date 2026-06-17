import { notFound } from "next/navigation"
import Link from "next/link"
import { getDealById, getActivities, getClients } from "@/server/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StageChanger } from "@/components/deals/stage-changer"
import { DealFormDialog } from "@/components/deals/deal-form-dialog"
import { ActivityComposer } from "@/components/activities/activity-composer"
import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { formatRON } from "@/lib/money"
import { STAGE_LABEL } from "@/lib/types"
import { ArrowLeft, Pencil, Building2 } from "lucide-react"

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = await getDealById(id)
  if (!deal) notFound()

  const [activities, clients] = await Promise.all([getActivities({ dealId: id }), getClients()])
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }))
  const isClosed = deal.stage === "won" || deal.stage === "lost"

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/deals"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Înapoi la oportunități
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{deal.title}</h1>
            <Badge variant={deal.stage === "won" ? "default" : deal.stage === "lost" ? "destructive" : "outline"}>
              {STAGE_LABEL[deal.stage]}
            </Badge>
          </div>
          {deal.client && (
            <Link
              href={`/dashboard/clients/${deal.client.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Building2 className="size-3.5" />
              {deal.client.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tabular-nums">{formatRON(deal.value_ron)}</span>
          <DealFormDialog
            clients={clientOptions}
            deal={deal}
            trigger={
              <Button variant="outline" size="icon" aria-label="Editează oportunitatea">
                <Pencil className="size-4" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adaugă activitate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActivityComposer dealId={id} />
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schimbă etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <StageChanger dealId={id} current={deal.stage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Dată estimată" value={deal.expected_close_date ?? "—"} />
              {deal.stage === "lost" && deal.lost_reason && (
                <Row label="Motiv pierdere" value={deal.lost_reason} />
              )}
              {isClosed && <p className="text-xs text-muted-foreground">Oportunitate închisă.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
