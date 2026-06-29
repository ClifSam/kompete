// src/app/analyze/api/route.ts
import { NextRequest } from 'next/server'
import { runCompetitiveAnalysis } from '@/lib/claude-agent'
import type { StreamEvent } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const raw: unknown = (body as Record<string, unknown>)?.company
  if (typeof raw !== 'string' || !raw.trim()) {
    return new Response(JSON.stringify({ error: 'Company name required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const company = raw.trim()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        )
      }

      try {
        for await (const event of runCompetitiveAnalysis(company)) {
          send(event)
        }
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
