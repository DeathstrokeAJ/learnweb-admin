import Redis from "ioredis"

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined
}

function getRedisClient(): Redis {
  if (global.redisClient) {
    return global.redisClient
  }

  const url = process.env.REDIS_URL

  if (!url) {
    // Return a mock Redis client for development without Redis
    const mockRedis = {
      get: async () => null,
      set: async () => "OK",
      del: async () => 1,
      incr: async () => 1,
      expire: async () => 1,
      ttl: async () => -1,
      setex: async () => "OK",
      exists: async () => 0,
      keys: async () => [],
      pipeline: () => ({
        exec: async () => [],
        get: () => mockRedis,
        set: () => mockRedis,
        del: () => mockRedis,
        incr: () => mockRedis,
        expire: () => mockRedis,
      }),
    } as unknown as Redis
    return mockRedis
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    lazyConnect: true,
  })

  global.redisClient = client
  return client
}

export const redis = getRedisClient()
export default redis
