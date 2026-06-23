"use client"

import { useState } from "react"
import { AiDocumentChat } from "@/components/dashboard/ai-document-chat"

type Props = {
  clients: { id: string; name: string }[]
  deals: { id: string; title: string }[]
}

export function AiDocumentsClientPicker({ clients, deals }: Props) {
  const [contextType, setContextType] = useState<"client" | "deal">("client")
  const [selectedId, setSelectedId] = useState<string>("")

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => { setContextType("client"); setSelectedId("") }}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${contextType === "client" ? "border-primary bg-primary/10" : "border-input"}`}
          >
            Client
          </button>
          <button
            onClick={() => { setContextType("deal"); setSelectedId("") }}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${contextType === "deal" ? "border-primary bg-primary/10" : "border-input"}`}
          >
            Deal
          </button>
        </div>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Selectează...</option>
          {contextType === "client"
            ? clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
            : deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
      </div>

      <div className="h-[600px]">
        {selectedId ? (
          <AiDocumentChat
            clientId={contextType === "client" ? selectedId : undefined}
            dealId={contextType === "deal" ? selectedId : undefined}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Selectează un context pentru a începe.</p>
        )}
      </div>
    </div>
  )
}