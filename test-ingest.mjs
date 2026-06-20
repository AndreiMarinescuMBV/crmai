import { createHmac } from "crypto"

const documentId = process.argv[2]
if (!documentId) {
  console.error("Usage: node test-ingest.mjs <document_id>")
  process.exit(1)
}

const secret = "d16b3c095afe4827"
const body = JSON.stringify({ document_id: documentId })
const signature = createHmac("sha256", secret).update(body).digest("hex")

const res = await fetch("http://localhost:3000/api/documents/ingest", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ingest-signature": signature,
  },
  body,
})

console.log(res.status, await res.json())