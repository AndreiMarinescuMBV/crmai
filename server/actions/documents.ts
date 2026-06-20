"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getTenantContext } from "@/lib/guards"
import { type ActionResult, ok, fail } from "@/lib/action-result"
import { documentSchema } from "@/lib/validation/document-schema"

export async function listDocumentsAction(): Promise<ActionResult<{ id: string; file_name: string; mime_type: string; file_size: number; created_at: string; client_id: string | null; deal_id: string | null }[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, file_size, created_at, client_id, deal_id")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) return fail(error.message)
  return ok(data)
}

export async function createDocumentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = documentSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide")

  const ctx = await getTenantContext()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: ctx.tenantId,
      uploaded_by: ctx.userId,
      file_name: parsed.data.file_name,
      mime_type: parsed.data.mime_type,
      file_size: parsed.data.file_size,
      storage_path: parsed.data.storage_path,
      client_id: parsed.data.client_id ?? null,
      deal_id: parsed.data.deal_id ?? null,
    })
    .select("id")
    .single()

  if (error) return fail(error.message)
  revalidatePath("/dashboard/documents")
  return ok({ id: data.id })
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return fail(error.message)
  revalidatePath("/dashboard/documents")
  return ok(undefined)
}
export async function uploadDocumentAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const file = formData.get("file") as File | null
  const clientId = formData.get("client_id") as string | null
  const dealId = formData.get("deal_id") as string | null

  if (!file || file.size === 0) return fail("Niciun fișier selectat")

  const ctx = await getTenantContext()
  const supabase = await createClient()

  // Construim path-ul respectând convenția RLS: <tenant_id>/<filename>
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${ctx.tenantId}/${Date.now()}-${safeFileName}`

  // 1. Upload în storage
  const { error: uploadError } = await supabase.storage
    .from("crm-documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return fail(`Eroare upload: ${uploadError.message}`)

  // 2. Validăm + inserăm rândul în tabel
  const parsed = documentSchema.safeParse({
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
    storage_path: storagePath,
    client_id: clientId || undefined,
    deal_id: dealId || undefined,
  })

  if (!parsed.success) {
    // Curățăm fișierul orfan din storage dacă validarea eșuează
    await supabase.storage.from("crm-documents").remove([storagePath])
    return fail(parsed.error.issues[0]?.message ?? "Date invalide")
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: ctx.tenantId,
      uploaded_by: ctx.userId,
      file_name: parsed.data.file_name,
      mime_type: parsed.data.mime_type,
      file_size: parsed.data.file_size,
      storage_path: parsed.data.storage_path,
      client_id: parsed.data.client_id ?? null,
      deal_id: parsed.data.deal_id ?? null,
    })
    .select("id")
    .single()

  if (error) {
    await supabase.storage.from("crm-documents").remove([storagePath])
    return fail(error.message)
  }

  revalidatePath("/dashboard/documents")
  return ok({ id: data.id })
}
