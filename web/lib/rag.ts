import { createHash } from 'crypto'

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'
const OPENAI_EMBEDDING_DIMENSIONS = 1536

export function hashText(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex')
}

export async function generateEmbedding(text: string): Promise<{
  embedding: number[] | null
  model: string
}> {
  const apiKey = process.env.OPENAI_API_KEY
  const normalizedText = text.trim().toLowerCase()

  if (!apiKey || !normalizedText) {
    return {
      embedding: null,
      model: OPENAI_EMBEDDING_MODEL,
    }
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: normalizedText,
      model: OPENAI_EMBEDDING_MODEL,
      dimensions: OPENAI_EMBEDDING_DIMENSIONS,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(
      `OpenAI API error: ${error?.error?.message || response.statusText || 'Unknown error'}`
    )
  }

  const result = await response.json()

  return {
    embedding: result.data?.[0]?.embedding || null,
    model: OPENAI_EMBEDDING_MODEL,
  }
}
