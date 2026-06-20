import { extractText, getDocumentProxy } from "unpdf"
import mammoth from "mammoth"

export type ParsedPage = {
  pageNumber: number | null
  text: string
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedPage[]> {
  if (mimeType === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: false })
    // `text` e un array de string-uri, unul per pagină
    return text.map((pageText, idx) => ({
      pageNumber: idx + 1,
      text: pageText,
    }))
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value } = await mammoth.extractRawText({ buffer })
    // DOCX nu are concept nativ de "pagină" la nivel de text extras
    return [{ pageNumber: null, text: value }]
  }

  throw new Error(`Tip de fișier neacceptat pentru ingest: ${mimeType}`)
}