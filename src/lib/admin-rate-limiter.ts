import { adminLimiter as redisAdminLimiter, checkLimit } from "./redis-rate-limiter"

export const adminLimiter = {
  async check(identifier: string): Promise<boolean> {
    const { success } = await checkLimit(redisAdminLimiter, identifier)
    return success
  },
}

export async function checkAdminRateLimit(ip: string) {
  return checkLimit(redisAdminLimiter, ip)
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
  return {
    body: {
      message: "Too many requests. Please try again later.",
      retryAfter,
    },
    headers: { "Retry-After": String(retryAfter) },
  }
}
