# Design

## Color

### Strategy
Restrained — pure white surface, one olive primary brand color, one teal accent for live/streaming states only. Accent covers ≤10% of total surface area.

Brand seed: `oklch(0.550 0.142 130.0)` — yellow-green / olive (seed-155)

### Palette

```css
/* Backgrounds */
--color-bg:              oklch(1.000 0.000   0);     /* pure white — never tinted */
--color-surface:         oklch(0.968 0.006 130.0);   /* card / panel — subtle olive tint */
--color-surface-raised:  oklch(0.940 0.008 130.0);   /* elevated panel, hover fill */

/* Borders */
--color-border:          oklch(0.880 0.004 130.0);   /* default dividers */
--color-border-strong:   oklch(0.760 0.008 130.0);   /* emphasis, focus-adjacent borders */

/* Text */
--color-ink:             oklch(0.130 0.016 130.0);   /* body text — ≥7:1 on bg */
--color-muted:           oklch(0.490 0.012 130.0);   /* secondary labels — ≥4.5:1 on bg */
--color-placeholder:     oklch(0.570 0.008 130.0);   /* form placeholder — ≥4.5:1 on bg */

/* Primary — deep olive (Smart · Clean · Precise) */
--color-primary:         oklch(0.420 0.128 130.0);   /* buttons, selected states, focus rings */
--color-primary-hover:   oklch(0.370 0.118 130.0);   /* primary hover */
--color-primary-fg:      oklch(0.985 0.000   0);     /* white on primary fill — always */

/* Accent — teal (live / streaming states only) */
--color-accent:          oklch(0.680 0.155 204.0);   /* streaming badge, live indicator, active */
--color-accent-hover:    oklch(0.620 0.148 204.0);   /* accent hover */
--color-accent-fg:       oklch(0.985 0.000   0);     /* white on accent fill — always */

/* Semantic */
--color-success:         oklch(0.500 0.138 145.0);   /* completed analysis, verified source */
--color-success-fg:      oklch(0.985 0.000   0);
--color-destructive:     oklch(0.577 0.245  27.3);   /* errors */
--color-destructive-fg:  oklch(0.985 0.000   0);
--color-warning:         oklch(0.720 0.150  75.0);   /* caution — dark ink text on this */
--color-warning-fg:      oklch(0.130 0.016 130.0);   /* dark text on pale warning fill */
```

### Usage rules
- Primary filled buttons + selected states: `--color-primary` bg + `--color-primary-fg` text (white always)
- Accent for "agent is active / streaming": `--color-accent` + `--color-accent-fg` — never use for decoration
- Warning fills use dark text (`--color-warning-fg`); all other semantic fills use white
- No colored side stripes on cards. No gradient text. No glassmorphism.

## Typography

### Fonts
- **UI / Display:** Geist Sans — geometric, precise. Already installed via `next/font/google`.
- **Streaming output / Code:** Geist Mono — agent log, tool calls, source URLs. Already installed.
- One-family system. No secondary typeface needed.

### Scale (fixed rem — not fluid; product UI)
```
12px / 0.75rem   — metadata, timestamps, tags
14px / 0.875rem  — secondary content, table data, button labels
16px / 1rem      — body text, form fields (default)
18px / 1.125rem  — section subheadings
20px / 1.25rem   — card headings, competitor names
24px / 1.5rem    — page section titles
30px / 1.875rem  — results count, hero stat
36px / 2.25rem   — landing hero headline (max on mobile)
```

### Weights
- 400 — body text, descriptions
- 500 — UI labels, secondary headings, interactive elements
- 600 — primary headings, competitor names, card titles
- 700 — landing hero only (one use per surface)

### Line length
- Prose / analysis output: max 72ch
- Data / labels: unrestricted

### Text wrap
- h1–h3: `text-wrap: balance`
- Prose paragraphs: `text-wrap: pretty`

## Spacing

Tailwind scale. Key intervals:
```
4px  (1)  — icon-to-label gap, badge padding
8px  (2)  — tight component spacing
12px (3)  — compact card inner padding
16px (4)  — standard padding, rhythm unit
24px (6)  — between sections within a card
32px (8)  — between cards, major UI regions
48px (12) — page breathing room
64px (16) — section separation (landing only)
```

## Border Radius

```
4px  — badges, tags, inline code
8px  — cards, inputs, buttons (default)
12px — panels, popovers
16px — hero containers (landing only)
```
No pill buttons (border-radius: 9999px). Precise product, not friendly app.

## Shadows

Border-first philosophy. Cards use border + minimal shadow; never decorative stacking.

```
shadow-sm:  0 1px 2px oklch(0 0 0 / 0.05)   — input lift, default cards
shadow:     0 2px 8px oklch(0 0 0 / 0.08)   — floating panels, dropdowns
shadow-lg:  0 8px 24px oklch(0 0 0 / 0.10)  — modals (rare)
```

## Motion

- Duration: 150–200ms state transitions; 200–300ms content reveals
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)
- No page-load orchestration. Product loads into the task.
- List stagger: 50ms max between items (competitor cards appearing)

### Streaming
- Agent log lines: `opacity 0→1` in 100ms — no slide, no char-by-char
- Competitor cards: translate-y 6px + opacity 0→1 in 200ms
- Reduced motion: opacity only, instant, no translate

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Components

### Buttons
- **Primary**: `bg-primary text-primary-fg rounded-[8px] px-4 py-2 text-sm font-medium`
- **Secondary**: `border border-border bg-transparent text-ink rounded-[8px] px-4 py-2 text-sm`
- **Ghost**: no border, no bg — `text-muted` hover → `text-ink`
- Focus ring: `ring-2 ring-primary ring-offset-2` on all variants
- States: default, hover, focus, active, disabled (opacity-40 cursor-not-allowed), loading (inline spinner)

### Cards
- `bg-surface border border-border rounded-[8px] shadow-sm`
- No nested cards. No side-stripe borders.
- Competitor cards: structured hierarchy — name (600) → tagline (400 muted) → metadata row

### Inputs
- `bg-bg border border-border rounded-[8px] px-3 py-2 text-base text-ink`
- Focus: `border-primary ring-2 ring-primary/20`
- Placeholder: `text-placeholder` (≥4.5:1 — not default gray)
- Error: `border-destructive` + error text below in `text-destructive text-sm`

### Badges / Status pills
- "Analyzing": `bg-accent text-accent-fg rounded-[4px] px-2 py-0.5 text-xs font-medium`
- "Complete": `bg-success text-success-fg` same shape
- Category tags: `bg-surface-raised text-muted border border-border` — dark text, light fill
- Never pill-shaped (9999px radius)

### Agent log / Streaming output
- `font-mono text-sm` throughout
- Line reveal: `opacity 0→1` 100ms per line, no slide
- Live dot: 6px `bg-accent` circle, animate-pulse → off on complete
- Max-height with overflow-y scroll; `text-muted` for metadata, `text-ink` for findings

### Skeleton states
- `bg-surface-raised animate-pulse` — match exact content shape
- Competitor card: title bar (h-5 w-32) + 3 lines (h-4 w-full/3/4) + meta row (h-3 w-24)

### Empty states
- Centered, instructional, one CTA
- No stock illustration — single-color SVG icon in `text-border` tone if any
