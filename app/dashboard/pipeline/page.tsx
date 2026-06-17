import { getDeals } from "@/server/data"
import { KanbanBoard } from "@/components/pipeline/kanban-board"

export default async function PipelinePage() {
  const deals = await getDeals()
  const boardDeals = deals.map((d) => ({
    id: d.id,
    title: d.title,
    value_ron: d.value_ron,
    stage: d.stage,
    client_name: d.client?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Trage oportunitățile între etape pentru a actualiza stadiul.
        </p>
      </div>
      <KanbanBoard initialDeals={boardDeals} />
    </div>
  )
}
