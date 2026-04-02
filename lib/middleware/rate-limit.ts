import redis from "@/lib/db/redis"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const defaults: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
}

export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { windowMs, maxRequests } = { ...defaults, ...config }
  const windowSeconds = Math.ceil(windowMs / 1000)
  const key = `ratelimit:${identifier}`

  try {
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    const ttl = await redis.ttl(key)
    const resetAt = Date.now() + ttl * 1000

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt,
    }
  } catch {
    // If Redis is unavailable, allow the request
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs }
  }
}
