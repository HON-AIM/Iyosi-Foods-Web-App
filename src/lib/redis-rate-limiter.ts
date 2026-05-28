import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null

function createLimiter(
  prefix: string,
  requests: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`
) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
  })
}

export const registrationLimiter = createLimiter("register", 5, "15 m")
export const passwordResetLimiter = createLimiter("pwd_reset", 3, "1 h")
export const adminLimiter = createLimiter("admin", 60, "15 m")

export async function checkLimit(limiter: Ratelimit | null, identifier: string) {
  if (!limiter) {
    return { success: true, remaining: 999, resetAt: Date.now() + 900_000 }
  }

  const { success, remaining, reset } = await limiter.limit(identifier)
  return { success, remaining, resetAt: reset }
}
