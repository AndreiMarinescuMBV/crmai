"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { uploadDocumentAction } from "@/server/actions/documents"

type ClientOption = { id: string; name: string }

export function DocumentUploadForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setIsUploading(true)

    const result = await uploadDocumentAction(formData)

    setIsUploading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    formRef.current?.reset()
    router.refresh()
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mb-6 rounded-md border p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Fișier</label>
        <input
          type="file"
          name="file"
          required
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Client</label>
        <select name="client_id" className="block w-full rounded-md border px-3 py-1.5 text-sm">
          <option value="">— Selectează client —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          (Asocierea cu un deal va fi adăugată ulterior)
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isUploading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isUploading ? "Se încarcă..." : "Încarcă document"}
      </button>
    </form>
  )
}