import { RateLimiter } from "./rate-limiter";

export const adminLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "admin:",
});

export const adminAuthLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "admin_auth:",
});

export function createAdminRateLimitResponse() {
  return {
    message: "Too many requests. Please try again later.",
    retryAfter: 900,
  };
}

export function setAdminRateLimitHeaders(response: any, remaining: number) {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil((Date.now() + 900000) / 1000)));
  return response;
}
