// 서버 메모리에 요청 시각을 기록하는 간단한 횟수 제한.
// Vercel처럼 서버 인스턴스가 여러 개면 인스턴스마다 따로 세므로 정확하지 않다.
// 크레딧 남용을 줄이는 1차 방어선이고, 최종 안전장치는 Anthropic 크레딧(자동충전 꺼 둠)이다.

export interface RateLimitWindow {
  windowMs: number;
  max: number;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function createRateLimiter(windows: RateLimitWindow[], maxKeys = 5000) {
  const longestWindowMs = Math.max(...windows.map((w) => w.windowMs));
  const hits = new Map<string, number[]>();

  function check(key: string, now = Date.now()): RateLimitResult {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < longestWindowMs);

    for (const { windowMs, max } of windows) {
      const inWindow = recent.filter((t) => now - t < windowMs);
      if (inWindow.length >= max) {
        // 이 창에서 가장 오래된 요청이 빠지는 시각까지 기다리면 된다
        const retryAfterMs = inWindow[0] + windowMs - now;
        hits.set(key, recent);
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
      }
    }

    recent.push(now);
    // 최근에 쓴 키를 맨 뒤로 보내고, 너무 많아지면 가장 오래 안 쓴 키부터 지운다
    hits.delete(key);
    hits.set(key, recent);
    if (hits.size > maxKeys) {
      const oldestKey = hits.keys().next().value;
      if (oldestKey !== undefined) hits.delete(oldestKey);
    }
    return { ok: true };
  }

  return { check };
}

// 프록시(Vercel)가 붙여 주는 헤더에서 요청자 IP를 꺼낸다. 첫 번째 값이 실제 클라이언트다.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// AI 추천: 1분에 5번, 하루 30번 (IP 기준)
export const suggestRateLimiter = createRateLimiter([
  { windowMs: 60_000, max: 5 },
  { windowMs: 24 * 60 * 60_000, max: 30 },
]);
