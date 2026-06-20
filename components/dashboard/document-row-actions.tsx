"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteDocumentAction } from "@/server/actions/documents"
import { Trash2 } from "lucide-react"

export function DocumentRowActions({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Ștergi acest document?")) return

    setIsDeleting(true)
    const result = await deleteDocumentAction(documentId)
    setIsDeleting(false)

    if (!result.ok) {
      alert(`Eroare: ${result.error}`)
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-muted-foreground hover:text-red-500 disabled:opacity-50"
      title="Șterge document"
    >
      <Trash2 className="size-4" />
    </button>
  )
}