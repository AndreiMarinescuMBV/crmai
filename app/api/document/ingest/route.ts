import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { ingestDocument } from "@/server/services/ingest"

function verifyHmacSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false

  const secret = process.env.INGEST_HMAC_SECRET
  if (!secret) {
    throw new Error("INGEST_HMAC_SECRET nu e setat în mediu")
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")

  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(signatureHeader, "hex")
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-ingest-signature")

  if (!verifyHmacSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Semnătură invalidă" }, { status: 401 })
  }

  let documentId: string
  try {
    const parsed = JSON.parse(rawBody)
    documentId = parsed.document_id
    if (!documentId || typeof documentId !== "string") {
      throw new Error("document_id lipsă sau invalid")
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Body invalid" }, { status: 400 })
  }

  const result = await ingestDocument(documentId)

  if (!result.ok) {
    return NextResponse.json(result, { status: 422 })
  }

  return NextResponse.json(result, { status: 200 })
}