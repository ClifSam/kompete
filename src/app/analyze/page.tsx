'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { StreamEvent, Report, Competitor } from '@/lib/types'

interface LogEntry {
  id: number
  type: 'status' | 'search' | 'found'
  text: string
}

let uid = 0

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav className="flex items-center py-5 mb-2">
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Kompete
      </span>
    </nav>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const variants = {
    status: {
      prefix: '·',
      prefixClass: 'text-[var(--kompete-border-strong)]',
      textClass: 'text-muted-foreground',
    },
    search: {
      prefix: '›',
      prefixClass: 'text-[var(--kompete-live)]',
      textClass: 'text-foreground',
    },
    found: {
      prefix: '↳',
      prefixClass: 'text-[var(--kompete-border-strong)]',
      textClass: 'text-muted-foreground',
    },
  }

  const { prefix, prefixClass, textClass } = variants[entry.type]

  return (
    <div className="log-line flex gap-2.5 py-0.5 leading-relaxed">
      <span className={`shrink-0 select-none ${prefixClass}`} aria-hidden>
        {prefix}
      </span>
      <span className={textClass}>{entry.text}</span>
    </div>
  )
}

function StatusBadge({ phase }: { phase: 'running' | 'done' | 'error' }) {
  if (phase === 'running') {
    return (
      <span
        role="status"
        aria-label="Analyzing"
        className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-xs font-medium"
        style={{
          background: 'var(--kompete-live)',
          color: 'var(--kompete-live-fg)',
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" aria-hidden />
        Analyzing
      </span>
    )
  }
  if (phase === 'done') {
    return (
      <span
        className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-medium"
        style={{
          background: 'var(--kompete-success)',
          color: 'var(--kompete-success-fg)',
        }}
      >
        Complete
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-[4px] bg-destructive px-2 py-0.5 text-xs font-medium text-[oklch(0.985_0_0)]">
      Error
    </span>
  )
}

function CompetitorCard({
  competitor,
  index,
}: {
  competitor: Competitor
  index: number
}) {
  const href = competitor.website
    ? competitor.website.startsWith('http')
      ? competitor.website
      : `https://${competitor.website}`
    : null

  return (
    <article
      className="competitor-card rounded-[8px] border border-border bg-card p-4 shadow-[0_1px_2px_oklch(0_0_0/0.05)]"
      style={{ '--card-delay': `${index * 50}ms` } as React.CSSProperties}
    >
      <div className="mb-2">
        <h3 className="text-base font-semibold leading-snug text-card-foreground">
          {competitor.name}
        </h3>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {competitor.website}
          </a>
        )}
      </div>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
        {competitor.description}
      </p>
      {competitor.strengths.length > 0 && (
        <ul className="space-y-1.5" aria-label="Key strengths">
          {competitor.strengths.map((s, i) => (
            <li key={i} className="flex gap-2 text-xs text-card-foreground">
              <span
                aria-hidden
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: 'var(--kompete-border-strong)' }}
              />
              {s}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const [company, setCompany] = useState('')
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  const runAnalysis = useCallback(async (companyName: string) => {
    setPhase('running')
    setLogs([])
    setReport(null)
    setErrorMsg(null)

    const addLog = (type: LogEntry['type'], text: string) =>
      setLogs((prev) => [...prev, { id: uid++, type, text }])

    let finalPhase: 'done' | 'error' | null = null

    try {
      const res = await fetch('/analyze/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName }),
      })

      if (!res.ok || !res.body) {
        setPhase('error')
        setErrorMsg(
          `Request failed (${res.status}). Make sure your API keys are set in .env.local.`
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const raw of lines) {
          if (!raw.startsWith('data: ')) continue
          let event: StreamEvent
          try {
            event = JSON.parse(raw.slice(6)) as StreamEvent
          } catch {
            continue
          }

          switch (event.type) {
            case 'status':
              addLog('status', event.message)
              break
            case 'search':
              addLog('search', `Searching: "${event.query}"`)
              break
            case 'found':
              addLog(
                'found',
                `${event.count} result${event.count !== 1 ? 's' : ''} found`
              )
              break
            case 'report':
              setReport(event.data)
              setPhase('done')
              finalPhase = 'done'
              break outer
            case 'error':
              setPhase('error')
              setErrorMsg(event.message)
              finalPhase = 'error'
              break outer
          }
        }
      }

      if (finalPhase === null) {
        setPhase('error')
        setErrorMsg('Analysis ended without a result. Please try again.')
      }
    } catch (err) {
      setPhase('error')
      setErrorMsg(
        err instanceof Error ? err.message : 'Unexpected error. Please try again.'
      )
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = company.trim()
    if (!trimmed || phase === 'running') return
    runAnalysis(trimmed)
  }

  const showLog = phase !== 'idle' && logs.length > 0
  const showReport = phase === 'done' && report !== null

  return (
    <main className="min-h-screen bg-background px-4 pb-20">
      <div className="mx-auto max-w-3xl">
        <NavBar />

        {/* Page header */}
        <header className="mb-8">
          <h1
            className="text-3xl font-semibold tracking-tight text-foreground"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Know your competition.
          </h1>
          <p className="mt-2 max-w-[55ch] text-base text-muted-foreground">
            Enter a company name. An AI agent searches the web and returns a
            structured competitive brief — competitors, gaps, and
            recommendations.
          </p>
        </header>

        {/* Search form */}
        <form onSubmit={handleSubmit} aria-label="Competitive analysis form">
          <div className="flex gap-2">
            <label htmlFor="company-input" className="sr-only">
              Company name
            </label>
            <input
              id="company-input"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Notion, Figma, Linear…"
              autoFocus
              disabled={phase === 'running'}
              className="min-w-0 flex-1 rounded-[8px] border border-border bg-background px-3 py-2.5 text-base text-foreground transition-colors placeholder:text-[var(--kompete-placeholder)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!company.trim() || phase === 'running'}
              className="shrink-0 rounded-[8px] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--kompete-primary-hover)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === 'running' ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </form>

        {/* Agent log */}
        {showLog && (
          <section
            className="mt-8"
            aria-label="Agent activity"
            aria-live="polite"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Agent log
              </span>
              <StatusBadge phase={phase as 'running' | 'done' | 'error'} />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-[8px] border border-border bg-card px-4 py-3 font-mono text-sm">
              {logs.map((entry) => (
                <LogLine key={entry.id} entry={entry} />
              ))}
              <div ref={logEndRef} />
            </div>
          </section>
        )}

        {/* Error message */}
        {phase === 'error' && errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {errorMsg}
          </div>
        )}

        {/* Report */}
        {showReport && report && (
          <div className="mt-10 space-y-10">

            {/* Summary */}
            <section aria-labelledby="summary-heading">
              <h2
                id="summary-heading"
                className="mb-2 text-lg font-semibold text-foreground"
              >
                Summary
              </h2>
              <p
                className="max-w-[72ch] text-base leading-relaxed text-foreground"
                style={{ textWrap: 'pretty' } as React.CSSProperties}
              >
                {report.summary}
              </p>
            </section>

            {/* Competitors */}
            <section aria-labelledby="competitors-heading">
              <h2
                id="competitors-heading"
                className="mb-4 text-lg font-semibold text-foreground"
              >
                Competitors{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({report.competitors.length})
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {report.competitors.map((c, i) => (
                  <CompetitorCard key={c.name} competitor={c} index={i} />
                ))}
              </div>
            </section>

            {/* Gaps + Recommendations */}
            <div className="grid gap-8 sm:grid-cols-2">
              <section aria-labelledby="gaps-heading">
                <h2
                  id="gaps-heading"
                  className="mb-3 text-base font-semibold text-foreground"
                >
                  Market Gaps
                </h2>
                <ul className="space-y-2.5" role="list">
                  {report.gaps.map((gap, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-foreground">
                      <span
                        aria-hidden
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      />
                      {gap}
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="recs-heading">
                <h2
                  id="recs-heading"
                  className="mb-3 text-base font-semibold text-foreground"
                >
                  Recommendations
                </h2>
                <ul className="space-y-2.5" role="list">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-foreground">
                      <span
                        aria-hidden
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: 'var(--kompete-live)' }}
                      />
                      {rec}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
