import { Redis } from "@upstash/redis"

// Reuse the same Upstash instance as rate limiting.
// Lazy + null-safe: if env vars are missing, every call falls through to the
// database instead of crashing the module import.
let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

type CacheOptions = {
  ttl?: number // seconds, default 300 (5 minutes)
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const redis = getRedis()
  const ttl = options.ttl ?? 300

  try {
    if (redis) {
      const cached = await redis.get<T>(key)
      if (cached !== null && cached !== undefined) return cached

      const fresh = await fetcher()
      // JSON round-trip so Dates serialize consistently with cache hits
      await redis.setex(key, ttl, JSON.stringify(fresh))
      return fresh
    }
  } catch {
    // Cache failure is NON-FATAL — fall through to the database
  }
  return fetcher()
}

export async function invalidateCache(...keys: string[]) {
  const redis = getRedis()
  try {
    if (redis && keys.length > 0) await redis.del(...keys)
  } catch {
    // Non-fatal — cache will expire naturally at TTL
  }
}

// Cache key constants — keep them consistent across files
export const CACHE_KEYS = {
  products: (category?: string) => `products:${category || "all"}`,
  recommended: (category?: string) => `products:recommended:${category || "all"}`,
  flashSaleProducts: () => "products:flash-sale",
  storeSettings: () => "store:settings",
  productDetail: (id: string) => `product:${id}`,
} as const
