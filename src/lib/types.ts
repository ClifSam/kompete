// src/lib/types.ts

export interface Competitor {
  name: string
  description: string
  strengths: string[]
  website?: string
}

export interface Report {
  company: string
  summary: string
  competitors: Competitor[]
  gaps: string[]
  recommendations: string[]
}

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'search'; query: string }
  | { type: 'found'; count: number }
  | { type: 'report'; data: Report }
  | { type: 'error'; message: string }
