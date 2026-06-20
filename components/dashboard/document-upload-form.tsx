"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { uploadDocumentAction } from "@/server/actions/documents"

type ClientOption = { id: string; name: string }
type DealOption = { id: string; title: string }

export function DocumentUploadForm({
  clients,
  deals,
}: {
  clients: ClientOption[]
  deals: DealOption[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachTo, setAttachTo] = useState<"client" | "deal">("client")

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
    setAttachTo("client")
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
        <label className="block text-sm font-medium mb-2">Asociază cu</label>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="attach_to"
              value="client"
              checked={attachTo === "client"}
              onChange={() => setAttachTo("client")}
            />
            Client
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="attach_to"
              value="deal"
              checked={attachTo === "deal"}
              onChange={() => setAttachTo("deal")}
            />
            Deal
          </label>
        </div>

        {attachTo === "client" ? (
          <select
            name="client_id"
            required
            className="block w-full rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">— Selectează client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            name="deal_id"
            required
            className="block w-full rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">— Selectează deal —</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        )}
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