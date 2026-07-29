import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TransitErrorSource } from "@/types/odsay";

const { MockTransitApiError, mockFetchTransitRoute } = vi.hoisted(() => {
  class HoistedTransitApiError extends Error {
    status: number;
    source: TransitErrorSource;
    code?: string;
    details?: string;

    constructor(message: string, status: number, source: TransitErrorSource, code?: string, details?: string) {
      super(message);
      this.name = "TransitApiError";
      this.status = status;
      this.source = source;
      this.code = code;
      this.details = details;
    }
  }

  return {
    MockTransitApiError: HoistedTransitApiError,
    mockFetchTransitRoute: vi.fn(),
  };
});

vi.mock("@/lib/odsay", () => ({
  TransitApiError: MockTransitApiError,
  fetchTransitRoute: mockFetchTransitRoute,
}));

vi.mock("@/lib/transitRequestLimiter", () => ({
  scheduleTransitRequest: (task: () => Promise<unknown>) => task(),
}));

import { GET } from "@/app/api/transit/route";

describe("GET /api/transit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when coordinates are missing", async () => {
    const req = new NextRequest("http://localhost/api/transit?sx=1&sy=2");
    const res = await GET(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "출발지 및 목적지 좌표(sx, sy, ex, ey)가 모두 필요합니다.",
    });
  });

  it("maps -98 response to walk-only success payload", async () => {
    mockFetchTransitRoute.mockResolvedValueOnce({
      error: { code: "-98", msg: "출발지와 도착지가 700m 이내입니다." },
    });

    const req = new NextRequest("http://localhost/api/transit?sx=1&sy=2&ex=3&ey=4");
    const res = await GET(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      totalTime: 0,
      payment: 0,
      transitCount: 0,
      pathType: 0,
      walkOnly: true,
    });
  });

  it("maps upstream-style error codes to route status", async () => {
    mockFetchTransitRoute.mockResolvedValueOnce({
      error: { code: "-8", msg: "출발지가 없습니다." },
    });

    const req = new NextRequest("http://localhost/api/transit?sx=1&sy=2&ex=3&ey=4");
    const res = await GET(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "출발지가 없습니다.",
      errorCode: "-8",
      errorStatus: 400,
      errorSource: "odsay",
    });
  });

  it("returns 404 when no route exists", async () => {
    mockFetchTransitRoute.mockResolvedValueOnce({
      result: { path: [] },
    });

    const req = new NextRequest("http://localhost/api/transit?sx=1&sy=2&ex=3&ey=4");
    const res = await GET(req);

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: "이용 가능한 대중교통 경로가 없습니다.",
      errorStatus: 404,
      errorSource: "odsay",
    });
  });

  it("returns normalized success payload from first path", async () => {
    mockFetchTransitRoute.mockResolvedValueOnce({
      result: {
        path: [
          {
            pathType: 3,
            info: {
              totalTime: 26,
              payment: 1400,
              firstStartStation: "A",
              lastEndStation: "B",
              transitCount: 1,
              mapObj: "m1",
            },
            subPath: [{ trafficType: 3, distance: 100, sectionTime: 2 }],
          },
        ],
      },
    });

    const req = new NextRequest("http://localhost/api/transit?sx=1&sy=2&ex=3&ey=4");
    const res = await GET(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      totalTime: 26,
      payment: 1400,
      transitCount: 1,
      pathType: 3,
      subPath: [{ trafficType: 3, distance: 100, sectionTime: 2 }],
      mapObj: "m1",
    });
  });

  it("returns TransitApiError payload details when thrown", async () => {
    mockFetchTransitRoute.mockRejectedValueOnce(
      new MockTransitApiError("upstream 429", 429, "odsay", "429", "throttled")
    );

    const req = new NextRequest("http://localhost/api/transit?sx=1&sy=2&ex=3&ey=4");
    const res = await GET(req);

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({
      error: "upstream 429",
      errorCode: "429",
      errorStatus: 429,
      errorSource: "odsay",
      errorDetails: "throttled",
    });
  });
});
