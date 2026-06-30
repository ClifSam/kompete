# Kompete

AI-powered competitive intelligence. Enter a company name — an autonomous AI agent searches the web in real time and returns a structured brief with competitors, market gaps, and strategic recommendations.

**Live demo:** [kompete.vercel.app](https://kompete.vercel.app)

---

## What it does

1. You enter a company name (e.g. "Notion", "Stripe", "Linear")
2. An AI agent powered by Claude runs an **agentic loop**: it picks search queries, calls Tavily to search the web, reads results, decides on follow-up searches, and synthesizes everything
3. The results stream back in real time — you watch the agent's searches as they happen, then competitor cards and a structured brief appear

No manual research. No copy-pasting from Google. Under two minutes.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| AI | Anthropic Claude (`claude-sonnet-4-6`) with tool use |
| Search | Tavily API |
| Streaming | Server-Sent Events (SSE) via Next.js API routes |
| Deploy | Vercel |

---

## Architecture

The core is an **agentic loop** in `src/lib/claude-agent.ts`:

```
User input
  → Claude decides what to search
  → Tavily searches the web
  → Claude reads results
  → Claude decides: search more or stop?
  → Claude generates structured report
  → Report streamed to client via SSE
```

Claude uses **tool use** (function calling) to invoke a `web_search` tool backed by the Tavily API. The loop runs until Claude judges it has enough data (max 5 iterations). Each step is emitted as a Server-Sent Event so the browser can update in real time without waiting for the full response.

This implements the **ReAct pattern** (Reasoning + Acting) in production: the model alternates between reasoning about what to do and taking concrete actions (web searches), using the results of each action to inform the next step.

### Key files

```
src/
├── lib/
│   ├── claude-agent.ts   ← agentic loop: tool use + response synthesis
│   ├── tavily.ts         ← Tavily web search client
│   └── types.ts          ← shared TypeScript types (StreamEvent, Report, Competitor)
└── app/
    ├── page.tsx           ← landing page
    └── analyze/
        ├── page.tsx       ← main tool UI (form, agent log, competitor cards)
        └── api/route.ts   ← SSE API route: streams events to client
```

### Streaming in detail

The API route (`src/app/analyze/api/route.ts`) returns a `ReadableStream`. As the agent loop runs, it pushes `data: {...}\n\n` events — status updates, search queries, search results, and finally the complete report. The browser reads this stream incrementally via the Fetch API's `ReadableStreamDefaultReader`, updating the UI as each event arrives.

This avoids buffering the full response (which would defeat the purpose of streaming) and gives the user live feedback that the AI is actively working.

---

## Run locally

```bash
git clone https://github.com/yourusername/kompete
cd kompete
npm install
```

Create `.env.local` with your API keys:

```
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**API keys:**
- Anthropic: [console.anthropic.com](https://console.anthropic.com)
- Tavily: [tavily.com](https://tavily.com) (free tier available)

---

## Python equivalent

`python/agent.py` is a standalone Python script with the same agentic loop — using the Anthropic Python SDK and `requests` for Tavily. No web framework, just the core AI logic.

```bash
cd python
pip install -r requirements.txt
python agent.py
```

Useful for understanding the agentic loop without the Next.js layer, and for talking through the AI concepts in an interview.

---

## About this project

Built as a portfolio piece for the **AIP Internship in Korea** program to demonstrate practical AI engineering skills.

The goal was to ship a real, deployable AI product — not a tutorial clone — that shows:

- **Autonomous agent design:** the AI decides its own search strategy, not a hardcoded prompt
- **Tool use (function calling):** Claude calls external tools mid-generation
- **Real-time streaming:** server pushes events to client as the agent works
- **Production deployment:** live on Vercel with a real domain

Built with Claude Code (AI-assisted development) during active learning of Python and AI concepts through the [DataMasters AI Developer](https://datamasters.it) course. The Python script in `/python` reflects what I can explain line by line.
