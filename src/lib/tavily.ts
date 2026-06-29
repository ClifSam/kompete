// src/lib/tavily.ts

export interface TavilyResult {
  title: string
  url: string
  content: string
}

interface TavilyResponse {
  results: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
}

export async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error('TAVILY_API_KEY not set')

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: 5,
      search_depth: 'basic',
    }),
  })

  if (!response.ok) {
    throw new Error(`Tavily error: ${response.status}`)
  }

  const data: TavilyResponse = await response.json()
  return data.results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }))
}
