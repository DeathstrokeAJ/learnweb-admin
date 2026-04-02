export interface ModerationResult {
  toxicityScore: number
  spamScore: number
  nsfwScore: number
  overallRisk: number
  flags: string[]
  moderatedBy: string
}

// Toxicity keyword patterns (weighted)
const TOXICITY_PATTERNS: { pattern: RegExp; weight: number; flag: string }[] = [
  { pattern: /\b(hate|kill|die|murder|threat)\b/i, weight: 0.7, flag: "severe_toxicity" },
  { pattern: /\b(stupid|idiot|dumb|loser|moron|trash)\b/i, weight: 0.3, flag: "mild_toxicity" },
  { pattern: /\b(harassment|bully|stalk)\b/i, weight: 0.6, flag: "harassment" },
  { pattern: /\b(racist|sexist|bigot|discriminat)\b/i, weight: 0.8, flag: "hate_speech" },
  { pattern: /f+u+c+k+|s+h+i+t+|a+s+s+h+o+l+e+/i, weight: 0.4, flag: "profanity" },
]

// Spam patterns
const SPAM_PATTERNS: { pattern: RegExp; weight: number; flag: string }[] = [
  { pattern: /https?:\/\/\S+/g, weight: 0.1, flag: "contains_links" },
  { pattern: /(buy now|free money|click here|limited offer|act fast|subscribe)/i, weight: 0.6, flag: "promotional_spam" },
  { pattern: /(.)\1{5,}/g, weight: 0.4, flag: "repetitive_chars" },
  { pattern: /(.{10,})\1{2,}/g, weight: 0.5, flag: "repetitive_content" },
  { pattern: /[A-Z\s]{20,}/g, weight: 0.3, flag: "excessive_caps" },
  { pattern: /(dm me|whatsapp|telegram|join my|check bio)/i, weight: 0.5, flag: "self_promotion" },
]

// NSFW patterns
const NSFW_PATTERNS: { pattern: RegExp; weight: number; flag: string }[] = [
  { pattern: /\b(nsfw|xxx|porn|nude|naked|sex)\b/i, weight: 0.8, flag: "nsfw_explicit" },
  { pattern: /\b(onlyfans|fansly|18\+|adult content)\b/i, weight: 0.7, flag: "nsfw_reference" },
]

function calculatePatternScore(
  text: string,
  patterns: { pattern: RegExp; weight: number; flag: string }[]
): { score: number; flags: string[] } {
  let totalWeight = 0
  const flags: string[] = []

  for (const { pattern, weight, flag } of patterns) {
    const matches = text.match(new RegExp(pattern.source, pattern.flags))
    if (matches) {
      totalWeight += weight * Math.min(matches.length, 3) // Cap at 3 matches
      flags.push(flag)
    }
  }

  return { score: Math.min(totalWeight, 1), flags }
}

export function moderateContent(text: string, title?: string): ModerationResult {
  const fullText = `${title || ""} ${text}`.trim()

  const toxicity = calculatePatternScore(fullText, TOXICITY_PATTERNS)
  const spam = calculatePatternScore(fullText, SPAM_PATTERNS)
  const nsfw = calculatePatternScore(fullText, NSFW_PATTERNS)

  // Check text quality indicators
  const wordCount = fullText.split(/\s+/).length
  const isVeryShort = wordCount < 3

  // Additional spam heuristics
  let spamBonus = 0
  const linkMatches = fullText.match(/https?:\/\/\S+/g)
  if (linkMatches && linkMatches.length > 3) spamBonus += 0.3
  if (isVeryShort && linkMatches && linkMatches.length > 0) spamBonus += 0.2

  const finalSpamScore = Math.min(spam.score + spamBonus, 1)
  const overallRisk = Math.min(
    toxicity.score * 0.4 + finalSpamScore * 0.3 + nsfw.score * 0.3,
    1
  )

  return {
    toxicityScore: Math.round(toxicity.score * 1000) / 1000,
    spamScore: Math.round(finalSpamScore * 1000) / 1000,
    nsfwScore: Math.round(nsfw.score * 1000) / 1000,
    overallRisk: Math.round(overallRisk * 1000) / 1000,
    flags: [...toxicity.flags, ...spam.flags, ...nsfw.flags],
    moderatedBy: "rule-based",
  }
}

export function shouldEscalateToAI(result: ModerationResult): boolean {
  // Borderline cases: not clearly safe but not clearly harmful
  return result.overallRisk >= 0.3 && result.overallRisk < 0.7
}
