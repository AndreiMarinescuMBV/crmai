import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/server/supabase/admin";
import { unpdf } from "unpdf";
import mammoth from "mammoth";
import { embedMany } from "@/server/services/embeddings";
import { chunkText } from "@/lib/chunking";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function verifyHmac(req: Request) {
  const signature = req.headers.get("x-ingest-signature");
  if (!signature) return false;

  const body = ""; // webhook-ul nu trimite body util
  const hmac = crypto
    .createHmac("sha256", env.INGEST_HMAC_SECRET)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
}

export async function POST(req: Request) {
  try {
    // 1. HMAC
    if (!verifyHmac(req)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const supabase = createClient();

    // 2. Webhook-ul trimite document_id în query string
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("document_id");
    if (!documentId) {
      return NextResponse.json({ error: "Missing document_id" }, { status: 400 });
    }

    // 3. Citește rândul din DB
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Lock optimistic
    if (doc.ingest_status !== "pending") {
      return NextResponse.json({ ok: true, status: "already_processed" });
    }

    await supabase
      .from("documents")
      .update({ ingest_status: "processing" })
      .eq("id", documentId);

    // 4. Descarcă fișierul din Storage
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("crm-documents")
      .download(doc.storage_path);

    if (fileErr || !fileData) {
      throw new Error("Failed to download file");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 5. Parse PDF / DOCX
    let text = "";

    if (doc.mime_type === "application/pdf") {
      const parsed = await unpdf(buffer, { mode: "text" });
      text = parsed.text ?? "";
    } else if (
      doc.mime_type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value ?? "";
    } else {
      throw new Error("Unsupported file type");
    }

    if (!text.trim()) {
      throw new Error("Empty or unreadable document");
    }

    // 6. Chunking
    const chunks = chunkText(text, {
      maxTokens: 800,
      overlap: 120,
    });

    // 7. Embeddings
    const embeddings = await embedMany(chunks.map((c) => c.content));

    // 8. Upsert în document_chunks
    const rows = chunks.map((chunk, i) => ({
      tenant_id: doc.tenant_id,
      document_id: doc.id,
      page_number: chunk.page ?? null,
      chunk_index: i,
      content: chunk.content,
      content_sha: crypto.createHash("sha256").update(chunk.content).digest("hex"),
      embedding: embeddings[i],
    }));

    const { error: upsertErr } = await supabase
      .from("document_chunks")
      .upsert(rows, { onConflict: "content_sha" });

    if (upsertErr) throw upsertErr;

    // 9. Finalizare
    await supabase
      .from("documents")
      .update({ ingest_status: "done" })
      .eq("id", documentId);

    return NextResponse.json({ ok: true, chunks: rows.length });
  } catch (err: any) {
    console.error("INGEST ERROR:", err);

    const supabase = createClient();
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("document_id");

    if (documentId) {
      await supabase
        .from("documents")
        .update({ ingest_status: "failed" })
        .eq("id", documentId);
    }

    return NextResponse.json(
      { error: err.message ?? "Ingest failed" },
      { status: 500 }
    );
  }
}
