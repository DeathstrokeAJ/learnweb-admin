import type { ModerationResult } from "./moderation"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""

// Use a free or low-cost model
const MODEL = "meta-llama/llama-3.1-8b-instruct:free"

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function moderateWithAI(
  text: string,
  title?: string
): Promise<ModerationResult | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn("OpenRouter API key not configured, skipping AI moderation")
    return null
  }

  const prompt = `You are a content moderation AI. Analyze the following user-generated content and return a JSON object with moderation scores.

Content Title: ${title || "N/A"}
Content Body: ${text}

Return ONLY a valid JSON object (no markdown, no explanation) with these fields:
- toxicityScore: number between 0-1 (0 = not toxic, 1 = extremely toxic)
- spamScore: number between 0-1 (0 = not spam, 1 = definitely spam)
- nsfwScore: number between 0-1 (0 = safe, 1 = explicit NSFW)
- overallRisk: number between 0-1 (weighted average)
- flags: array of strings describing detected issues (e.g., ["mild_toxicity", "self_promotion"])
- reasoning: brief 1-sentence explanation

JSON:`

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "LearnWeb Moderation",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a precise content moderation system. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      console.error("OpenRouter API error:", response.status, await response.text())
      return null
    }

    const data: OpenRouterResponse = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) return null

    // Try to parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    return {
      toxicityScore: Math.min(Math.max(parsed.toxicityScore || 0, 0), 1),
      spamScore: Math.min(Math.max(parsed.spamScore || 0, 0), 1),
      nsfwScore: Math.min(Math.max(parsed.nsfwScore || 0, 0), 1),
      overallRisk: Math.min(Math.max(parsed.overallRisk || 0, 0), 1),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      moderatedBy: "openrouter",
    }
  } catch (error) {
    console.error("OpenRouter moderation error:", error)
    return null
  }
}
