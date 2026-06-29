// src/lib/claude-agent.ts
import Anthropic from '@anthropic-ai/sdk'
import { tavilySearch } from './tavily'
import type { StreamEvent, Report, Competitor } from './types'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a competitive intelligence analyst. Your job is to research a company's competitive landscape.

When given a company name, you MUST:
1. Use web_search to find the company's main competitors (search for "[company] competitors alternatives")
2. Use web_search to find details on each major competitor (search for each competitor name individually)
3. Use web_search to find market gaps and opportunities (search for "[company] market gaps unmet needs")

After gathering information, respond with a JSON object (no markdown fences, raw JSON only) in this exact format:
{
  "company": "company name",
  "summary": "2-3 sentence executive summary of the competitive landscape",
  "competitors": [
    {
      "name": "Competitor Name",
      "description": "what they do in one sentence",
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "website": "their domain if found"
    }
  ],
  "gaps": ["gap/opportunity 1", "gap/opportunity 2", "gap/opportunity 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Include 3-5 competitors. Be specific and factual based on what you found.`

const tools: Anthropic.Tool[] = [
  {
    name: 'web_search',
    description: 'Search the web for current information about companies and markets',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
]

export async function* runCompetitiveAnalysis(
  company: string
): AsyncGenerator<StreamEvent> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Analyze the competitive landscape for: ${company}`,
    },
  ]

  yield { type: 'status', message: 'Starting competitive analysis...' }

  let iterations = 0
  const maxIterations = 8

  while (iterations < maxIterations) {
    iterations++

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    })

    // Agent wants to use a tool
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      // Add assistant's response to message history
      messages.push({ role: 'assistant', content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === 'web_search') {
          const rawInput = toolUse.input
          if (
            typeof rawInput !== 'object' ||
            rawInput === null ||
            !('query' in rawInput) ||
            typeof (rawInput as { query: unknown }).query !== 'string'
          ) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: 'Invalid tool input.',
            })
            continue
          }
          const query = (rawInput as { query: string }).query
          yield { type: 'search', query }

          const results = await tavilySearch(query)
          yield { type: 'found', count: results.length }

          const resultText = results
            .map((r) => `## ${r.title}\n${r.url}\n${r.content}`)
            .join('\n\n')

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: resultText || 'No results found.',
          })
        }
      }

      if (toolResults.length === 0) {
        yield { type: 'error', message: 'Agent called unknown tool' }
        return
      }
      messages.push({ role: 'user', content: toolResults })
      continue
    }

    // Agent is done — extract final text response
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      )

      if (!textBlock) {
        yield { type: 'error', message: 'No response from agent' }
        return
      }

      yield { type: 'status', message: 'Generating report...' }

      try {
        const report: Report = JSON.parse(textBlock.text)
        yield { type: 'report', data: report }
      } catch {
        yield {
          type: 'error',
          message: 'Could not parse report. Try again.',
        }
      }
      return
    }

    yield { type: 'error', message: 'Unexpected agent state' }
    return
  }

  yield { type: 'error', message: 'Analysis timed out — too many steps' }
}
