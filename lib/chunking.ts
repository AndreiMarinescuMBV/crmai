import { encode } from "gpt-tokenizer";

export function chunkText(text: string, opts: { maxTokens: number; overlap: number }) {
  const tokens = encode(text);
  const chunks = [];

  let start = 0;
  while (start < tokens.length) {
    const end = Math.min(start + opts.maxTokens, tokens.length);
    const chunkTokens = tokens.slice(start, end);

    chunks.push({
      content: chunkTokens.map((t) => t).join(" "),
      page: null,
    });

    start += opts.maxTokens - opts.overlap;
  }

  return chunks;
}
