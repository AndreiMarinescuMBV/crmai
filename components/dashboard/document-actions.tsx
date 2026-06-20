"use client"

import { useState } from "react"
import { getDocumentUrlAction } from "@/server/actions/documents"

export function DocumentActions({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState<"preview" | "download" | null>(null)

  async function handleClick(mode: "preview" | "download") {
    setLoading(mode)
    const result = await getDocumentUrlAction(documentId, mode)
    setLoading(null)

    if (!result.ok) {
      alert(`Eroare: ${result.error}`)
      return
    }

    window.open(result.data.url, "_blank")
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleClick("preview")}
        disabled={loading !== null}
        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading === "preview" ? "..." : "Previzualizează"}
      </button>
      <button
        onClick={() => handleClick("download")}
        disabled={loading !== null}
        className="text-sm text-green-600 hover:underline disabled:opacity-50"
      >
        {loading === "download" ? "..." : "Descarcă"}
      </button>
    </div>
  )
}