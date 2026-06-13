import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Tiny in-memory fixed-window rate limiter for public endpoints (PRD §18).
 * Keyed by an arbitrary string (typically client IP). Not distributed — fine for
 * demo/single-instance; swap for Redis-backed limiting in multi-instance prod.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Throws HTTP 429 when the key exceeds `limit` requests per `windowMs`. */
  check(key: string): void {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      this.sweep(now);
      return;
    }
    entry.count += 1;
    if (entry.count > this.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new HttpException(
        { message: "Too many requests — slow down.", retryAfter },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Drop expired buckets occasionally so the map can't grow unbounded. */
  private sweep(now: number): void {
    if (this.hits.size < 5000) return;
    for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
  }
}
