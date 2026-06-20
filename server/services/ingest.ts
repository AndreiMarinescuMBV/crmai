"use server"

import { createHash } from "crypto"
import { createAdminClient } from "@/server/supabase/admin"
import { parseDocument } from "@/lib/ai/parse-document"
import { chunkText } from "@/lib/ai/chunking"
import { embedMany } from "ai"
import { openai } from "@ai-sdk/openai"

type IngestResult =
  | { ok: true; chunksInserted: number; chunksSkippedDuplicate: number }
  | { ok: false; error: string }

export async function ingestDocument(documentId: string): Promise<IngestResult> {
  const admin = createAdminClient()

  // 1. Citim rândul `documents` — tenant_id/context vin EXCLUSIV din DB, niciodată din input extern
  const { data: doc, error: docError } = await admin
    .from("documents")
    .select("id, tenant_id, file_name, mime_type, storage_path, deleted_at")
    .eq("id", documentId)
    .single()

  if (docError || !doc) {
    return { ok: false, error: "Document inexistent" }
  }
  if (doc.deleted_at) {
    return { ok: false, error: "Document șters, ingest anulat" }
  }

  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]
  if (!allowedMimeTypes.includes(doc.mime_type)) {
    return { ok: false, error: `MIME neacceptat pentru ingest: ${doc.mime_type}` }
  }

  // 2. Descărcăm fișierul din storage
  const { data: fileBlob, error: downloadError } = await admin.storage
    .from("crm-documents")
    .download(doc.storage_path)

  if (downloadError || !fileBlob) {
    return { ok: false, error: "Nu am putut descărca fișierul din storage" }
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer())

  // 3. Parse — PDF scanat (fără text extractabil) → failed, fără OCR (out of scope MVP)
  let pages
  try {
    pages = await parseDocument(buffer, doc.mime_type)
  } catch (e) {
    return { ok: false, error: `Eroare parsare: ${(e as Error).message}` }
  }

  const totalText = pages.map((p) => p.text).join(" ").trim()
  if (totalText.length === 0) {
    return {
      ok: false,
      error: "Niciun text extractabil (posibil PDF scanat, fără OCR în MVP)",
    }
  }

  // 4. Chunking per pagină (păstrăm page_number per chunk)
  type PendingChunk = { content: string; pageNumber: number | null; contentSha: string }
  const pending: PendingChunk[] = []

  for (const page of pages) {
    if (!page.text.trim()) continue
    const chunks = chunkText(page.text)
    for (const c of chunks) {
      const contentSha = createHash("sha256").update(c.content).digest("hex")
      pending.push({ content: c.content, pageNumber: page.pageNumber, contentSha })
    }
  }

  if (pending.length === 0) {
    return { ok: false, error: "Niciun chunk generat din text" }
  }

  // 5. Embeddings în batch
  const { embeddings } = await embedMany({
    model: openai.textEmbeddingModel("text-embedding-3-small"),
    values: pending.map((p) => p.content),
  })

  // 6. Upsert — dedupe pe (document_id, content_sha) via ON CONFLICT
  let inserted = 0
  let skipped = 0

  for (let i = 0; i < pending.length; i++) {
    const chunk = pending[i]
    const { error: insertError, data: insertData } = await admin
      .from("document_chunks")
      .upsert(
        {
          tenant_id: doc.tenant_id, // explicit din rândul documents, niciodată din input
          document_id: doc.id,
          page_number: chunk.pageNumber,
          chunk_index: i,
          content: chunk.content,
          content_sha: chunk.contentSha,
          embedding: embeddings[i],
        },
        {
          onConflict: "document_id,content_sha",
          ignoreDuplicates: true,
        }
      )
      .select("id")

    if (insertError) {
      return { ok: false, error: `Eroare insert chunk ${i}: ${insertError.message}` }
    }
    if (insertData && insertData.length > 0) {
      inserted++
    } else {
      skipped++
    }
  }

  return { ok: true, chunksInserted: inserted, chunksSkippedDuplicate: skipped }
}