import { getDeals } from "@/server/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRON } from "@/lib/money"
import { STAGE_LABEL, type DealStage } from "@/lib/types"
import { Target, TrendingUp, Trophy, Wallet } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const deals = await getDeals()

  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost")
  const won = deals.filter((d) => d.stage === "won")
  const pipelineValue = open.reduce((s, d) => s + Number(d.value_ron), 0)
  const wonValue = won.reduce((s, d) => s + Number(d.value_ron), 0)
  const closed = deals.filter((d) => d.stage === "won" || d.stage === "lost").length
  const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0

  const byStage = (["lead", "contacted", "offer_sent", "won", "lost"] as DealStage[]).map((stage) => ({
    stage,
    count: deals.filter((d) => d.stage === stage).length,
    value: deals.filter((d) => d.stage === stage).reduce((s, d) => s + Number(d.value_ron), 0),
  }))

  const stats = [
    { label: "Oportunități deschise", value: open.length.toString(), icon: Target },
    { label: "Valoare pipeline", value: formatRON(pipelineValue), icon: Wallet },
    { label: "Câștigate", value: formatRON(wonValue), icon: Trophy },
    { label: "Rată de câștig", value: `${winRate}%`, icon: TrendingUp },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Panou de control</h1>
        <p className="text-sm text-muted-foreground">Privire de ansamblu asupra activității comerciale</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuție pe etape</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byStage.map(({ stage, count, value }) => (
              <div key={stage} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="min-w-28 justify-center">
                    {STAGE_LABEL[stage]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{count} oport.</span>
                </div>
                <span className="text-sm font-medium tabular-nums">{formatRON(value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activitate recentă</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deals.slice(0, 6).map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/deals/${d.id}`}
                className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.client?.name ?? "Fără client"}</p>
                </div>
                <Badge variant="outline">{STAGE_LABEL[d.stage]}</Badge>
              </Link>
            ))}
            {deals.length === 0 && (
              <p className="text-sm text-muted-foreground">Nu există încă oportunități. Creați prima oportunitate.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
