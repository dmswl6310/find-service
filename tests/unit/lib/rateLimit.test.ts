import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit and then blocks with retry time", () => {
    const limiter = createRateLimiter([{ windowMs: 60_000, max: 2 }]);
    expect(limiter.check("a", 0)).toEqual({ ok: true });
    expect(limiter.check("a", 1_000)).toEqual({ ok: true });
    expect(limiter.check("a", 2_000)).toEqual({ ok: false, retryAfterSec: 58 });
  });

  it("allows again after the window passes", () => {
    const limiter = createRateLimiter([{ windowMs: 60_000, max: 1 }]);
    limiter.check("a", 0);
    expect(limiter.check("a", 59_999).ok).toBe(false);
    expect(limiter.check("a", 60_000).ok).toBe(true);
  });

  it("does not count blocked requests", () => {
    const limiter = createRateLimiter([{ windowMs: 60_000, max: 1 }]);
    limiter.check("a", 0);
    limiter.check("a", 10_000);
    limiter.check("a", 20_000);
    expect(limiter.check("a", 60_000).ok).toBe(true);
  });

  it("applies every window (per minute and per day)", () => {
    const limiter = createRateLimiter([
      { windowMs: 60_000, max: 5 },
      { windowMs: 86_400_000, max: 6 },
    ]);
    for (let i = 0; i < 5; i += 1) expect(limiter.check("a", i).ok).toBe(true);
    expect(limiter.check("a", 10).ok).toBe(false); // 분당 한도
    expect(limiter.check("a", 61_000).ok).toBe(true); // 6번째
    const blocked = limiter.check("a", 122_000); // 하루 한도
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(80_000);
  });

  it("counts each key separately", () => {
    const limiter = createRateLimiter([{ windowMs: 60_000, max: 1 }]);
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("b", 0).ok).toBe(true);
    expect(limiter.check("a", 1).ok).toBe(false);
  });

  it("forgets the least recently used key when too many keys", () => {
    const limiter = createRateLimiter([{ windowMs: 60_000, max: 1 }], 2);
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 0); // a가 밀려남
    expect(limiter.check("a", 1).ok).toBe(true);
    expect(limiter.check("c", 1).ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for value", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" } });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip, then unknown", () => {
    expect(getClientIp(new Request("http://x", { headers: { "x-real-ip": "3.3.3.3" } }))).toBe("3.3.3.3");
    expect(getClientIp(new Request("http://x"))).toBe("unknown");
  });
});
