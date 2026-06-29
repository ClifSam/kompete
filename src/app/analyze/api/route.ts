// src/app/analyze/api/route.ts
import { NextRequest } from 'next/server'
import { runCompetitiveAnalysis } from '@/lib/claude-agent'
import type { StreamEvent } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const body = await request.json()
  const company: string = body.company?.trim()

  if (!company) {
    return new Response(JSON.stringify({ error: 'Company name required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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
