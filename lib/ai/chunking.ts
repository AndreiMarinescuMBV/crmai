// Aproximare simplă tokeni: ~0.75 cuvinte per token (regulă empirică pentru text RO/EN mixt)
// Nu folosim tokenizer exact (tiktoken) ca să nu adăugăm o dependență grea doar pentru chunking aproximativ.

const TARGET_TOKENS = 800
const OVERLAP_TOKENS = 120
const WORDS_PER_TOKEN = 0.75

const TARGET_WORDS = Math.round(TARGET_TOKENS * WORDS_PER_TOKEN)
const OVERLAP_WORDS = Math.round(OVERLAP_TOKENS * WORDS_PER_TOKEN)

export type Chunk = {
  content: string
  chunkIndex: number
}

export function chunkText(text: string): Chunk[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks: Chunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < words.length) {
    const end = Math.min(start + TARGET_WORDS, words.length)
    const content = words.slice(start, end).join(" ").trim()
    if (content.length > 0) {
      chunks.push({ content, chunkIndex })
      chunkIndex++
    }
    if (end >= words.length) break
    start = end - OVERLAP_WORDS
  }

  return chunks
}