'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

// ── Static demo data ──────────────────────────────────────────────────────────

const HERO_LOGS = [
  { id: 0, type: 'status' as const, text: 'Starting analysis for Notion…' },
  { id: 1, type: 'search' as const, text: 'Searching: "Notion competitors 2024"' },
  { id: 2, type: 'found'  as const, text: '8 results found' },
  { id: 3, type: 'search' as const, text: 'Searching: "notion vs obsidian productivity"' },
  { id: 4, type: 'found'  as const, text: '5 results found' },
]

const HERO_COMPETITORS = [
  {
    name: 'Obsidian',
    website: 'obsidian.md',
    description:
      'Local-first knowledge base with a powerful plugin ecosystem. Strong with power users who prioritize data ownership.',
  },
  {
    name: 'Coda',
    website: 'coda.io',
    description:
      'Doc-meets-spreadsheet hybrid targeting teams that need structured workflows over freeform notes.',
  },
]

// ── Shared helpers ────────────────────────────────────────────────────────────

const LOG_VARIANTS = {
  status: { prefix: '·', pc: 'text-[var(--kompete-border-strong)]', tc: 'text-muted-foreground' },
  search: { prefix: '›', pc: 'text-[var(--kompete-live)]',          tc: 'text-foreground' },
  found:  { prefix: '↳', pc: 'text-[var(--kompete-border-strong)]', tc: 'text-muted-foreground' },
} as const

function LogEl({
  type,
  text,
  delay,
  animate = true,
}: {
  type: keyof typeof LOG_VARIANTS
  text: string
  delay?: number
  animate?: boolean
}) {
  const { prefix, pc, tc } = LOG_VARIANTS[type]
  return (
    <div
      className={`${animate ? 'log-line ' : ''}flex gap-2.5 py-0.5 leading-relaxed`}
      style={animate && delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}
    >
      <span className={`shrink-0 select-none ${pc}`} aria-hidden>{prefix}</span>
      <span className={tc}>{text}</span>
    </div>
  )
}

function AnalyzingBadge({ pulse = true }: { pulse?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: 'var(--kompete-live)', color: 'var(--kompete-live-fg)' }}
    >
      {pulse && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" aria-hidden />}
      Analyzing
    </span>
  )
}

// ── Hero product preview ──────────────────────────────────────────────────────

function HeroPreview() {
  return (
    <div
      className="w-full overflow-hidden rounded-[12px] bg-background"
      style={{
        border: '1px solid oklch(1 0 0 / 0.18)',
        boxShadow: '0 32px 72px oklch(0 0 0 / 0.40)',
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-[var(--kompete-surface-raised)] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[oklch(0.820_0.004_130)]" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-[oklch(0.820_0.004_130)]" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-[oklch(0.820_0.004_130)]" aria-hidden />
        <div className="ml-2 flex-1 rounded-[4px] bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground">
          kompete.vercel.app/analyze
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Form */}
        <div className="mb-5 flex gap-2">
          <div className="flex-1 rounded-[8px] border border-border bg-background px-3 py-2 text-sm text-foreground">
            Notion
          </div>
          <div
            className="shrink-0 rounded-[8px] px-4 py-2 text-xs font-medium"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Analyzing…
          </div>
        </div>

        {/* Agent log */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Agent log</span>
            <AnalyzingBadge />
          </div>
          <div className="rounded-[8px] border border-border bg-card px-4 py-3 font-mono text-[12px]">
            {HERO_LOGS.map((entry, i) => (
              <LogEl
                key={entry.id}
                type={entry.type}
                text={entry.text}
                delay={700 + i * 220}
              />
            ))}
          </div>
        </div>

        {/* Competitor cards */}
        <div className="grid grid-cols-2 gap-3">
          {HERO_COMPETITORS.map((c, i) => (
            <article
              key={c.name}
              className="competitor-card rounded-[8px] border border-border bg-card p-3"
              style={{ '--card-delay': `${1900 + i * 100}ms` } as React.CSSProperties}
            >
              <p className="mb-0.5 text-[13px] font-semibold text-card-foreground">{c.name}</p>
              <p className="mb-2 text-[11px] text-muted-foreground">{c.website}</p>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {c.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── How it works — step panels ────────────────────────────────────────────────

function StepInput() {
  return (
    <div className="rounded-[8px] border border-border bg-background p-4">
      <p className="mb-2 text-[11px] font-medium text-muted-foreground">Company name</p>
      <div className="flex gap-2">
        <div className="flex-1 rounded-[8px] border border-primary/40 bg-background px-3 py-2 text-sm text-foreground ring-2 ring-primary/15">
          Stripe
        </div>
        <div
          className="shrink-0 rounded-[8px] px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          Analyze
        </div>
      </div>
    </div>
  )
}

function StepLog() {
  const lines: { type: keyof typeof LOG_VARIANTS; text: string }[] = [
    { type: 'status', text: 'Initializing agent…' },
    { type: 'search', text: 'Searching: "Stripe payment competitors"' },
    { type: 'found',  text: '7 results found' },
    { type: 'search', text: 'Searching: "Braintree vs Stripe 2024"' },
    { type: 'found',  text: '4 results found' },
  ]
  return (
    <div className="rounded-[8px] border border-border bg-card px-4 py-4 font-mono text-[12px]">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Agent log</span>
        <AnalyzingBadge />
      </div>
      {lines.map((l, i) => (
        <LogEl key={i} type={l.type} text={l.text} animate={false} />
      ))}
    </div>
  )
}

function StepResults() {
  return (
    <div className="space-y-2">
      {(['Braintree', 'Adyen', 'Square'] as const).map((name) => (
        <div
          key={name}
          className="flex items-center gap-3 rounded-[8px] border border-border bg-card px-4 py-2.5"
        >
          <span className="text-sm font-semibold text-card-foreground">{name}</span>
          <span
            className="ml-auto rounded-[4px] px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            style={{ background: 'var(--kompete-surface-raised)' }}
          >
            competitor
          </span>
        </div>
      ))}
      <div className="rounded-[8px] border border-border bg-background px-4 py-3">
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">Summary</p>
        <p className="text-[12px] leading-relaxed text-foreground">
          Stripe leads on developer experience. Key gap: embedded finance APIs for SaaS platforms.
        </p>
      </div>
    </div>
  )
}

// ── How it works section ──────────────────────────────────────────────────────

const STEPS = [
  {
    panel: <StepInput />,
    label: 'Enter a company name',
    description:
      'Type any company — startup, enterprise, or product. No configuration needed.',
  },
  {
    panel: <StepLog />,
    label: 'The AI searches the web',
    description:
      'An autonomous agent runs targeted searches, reads sources, and decides what to look up next.',
  },
  {
    panel: <StepResults />,
    label: 'Read your competitive brief',
    description:
      'Competitors, market gaps, and strategic recommendations — structured and ready to share.',
  },
]

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = 'true'
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section aria-label="How it works" className="bg-background px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <h2
          className="mb-16 text-2xl font-semibold text-foreground"
          style={{ textWrap: 'balance' } as React.CSSProperties}
        >
          How it works
        </h2>

        <div ref={ref} className="hiw-grid grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="hiw-item flex flex-col gap-4"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              {step.panel}
              <div>
                <p className="mb-1 text-sm font-semibold text-foreground">{step.label}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-4 py-4 sm:px-6"
        style={{ background: 'var(--primary)' }}
      >
        <span className="text-sm font-semibold tracking-tight text-white">Kompete</span>
        <Link
          href="/analyze"
          className="rounded-[8px] border border-white/30 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[var(--primary)]"
        >
          Try it →
        </Link>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section
          className="px-4 pb-16 pt-14 sm:pb-20 sm:pt-16 sm:px-6"
          style={{ background: 'var(--primary)' }}
        >
          <div className="mx-auto max-w-4xl">
            {/* Headline + CTA */}
            <div className="hero-enter mb-10">
              <h1
                className="text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-tight text-white"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                Know your competition.
              </h1>
              <p className="mt-4 max-w-[50ch] text-base leading-relaxed text-white/70">
                An AI agent searches the web and returns a structured competitive
                brief — competitors, gaps, and recommendations — in under two minutes.
              </p>
              <Link
                href="/analyze"
                className="mt-7 inline-flex items-center gap-1.5 rounded-[8px] bg-white px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--primary)]"
                style={{ color: 'var(--primary)' }}
              >
                Try it free <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Product preview */}
            <div className="hero-preview-enter">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* How it works */}
        <HowItWorks />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">Kompete</span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Built with Claude + Tavily</span>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub →
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
