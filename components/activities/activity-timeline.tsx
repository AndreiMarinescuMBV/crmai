import { Phone, Users, StickyNote } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"
import { ACTIVITY_LABEL, type Activity, type ActivityType } from "@/lib/types"

const ICONS: Record<ActivityType, React.ElementType> = {
  call: Phone,
  meeting: Users,
  note: StickyNote,
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nicio activitate înregistrată încă.</p>
  }

  return (
    <ol className="space-y-4">
      {activities.map((a) => {
        const Icon = ICONS[a.type]
        return (
          <li key={a.id} className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 border-b border-border pb-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{a.subject}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.occurred_at), { addSuffix: true, locale: ro })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{ACTIVITY_LABEL[a.type]}</p>
              {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
