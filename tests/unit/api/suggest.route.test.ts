import { beforeEach, describe, expect, it, vi } from "vitest";

const generateTextMock = vi.fn();
const findNearbyStationsMock = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateTextMock(...args),
  Output: { object: (opts: unknown) => opts },
}));
vi.mock("@ai-sdk/anthropic", () => ({ anthropic: (id: string) => id }));
vi.mock("@/lib/nearbyStations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/nearbyStations")>();
  return { ...actual, findNearbyStations: (...args: unknown[]) => findNearbyStationsMock(...args) };
});

import { POST } from "@/app/api/suggest/route";

const stations = ["1", "2", "3"].map((id, i) => ({
  id,
  place_name: `역${id}`,
  x: String(127 + i * 0.01),
  y: "37.5",
}));

function makeRequest(ip: string) {
  return new Request("http://localhost/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({
      starts: [
        { name: "강남역", x: "127.0276", y: "37.4979" },
        { name: "홍대입구역", x: "126.9237", y: "37.5572" },
      ],
      purpose: "회식",
    }),
  });
}

describe("POST /api/suggest", () => {
  beforeEach(() => {
    generateTextMock.mockReset();
    findNearbyStationsMock.mockReset();
    findNearbyStationsMock.mockResolvedValue({ stations });
    generateTextMock.mockResolvedValue({
      output: { candidates: stations.map((s) => ({ stationId: s.id, reason: "좋아요" })) },
    });
  });

  it("returns 429 with Retry-After after 5 requests in a minute from the same IP", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await POST(makeRequest("10.0.0.1"))).status).toBe(200);
    }
    const blocked = await POST(makeRequest("10.0.0.1"));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(generateTextMock).toHaveBeenCalledTimes(5);

    // 다른 IP는 영향 없음
    expect((await POST(makeRequest("10.0.0.2"))).status).toBe(200);
  });

  it("passes a timeout to the model call and returns 504 when it times out", async () => {
    generateTextMock.mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    const res = await POST(makeRequest("10.0.0.3"));
    expect(res.status).toBe(504);
    expect(generateTextMock.mock.calls[0][0]).toMatchObject({ timeout: 10_000 });
  });

  it("finds a timeout wrapped inside another error", async () => {
    generateTextMock.mockRejectedValue(new Error("retry failed", { cause: new DOMException("t", "TimeoutError") }));
    expect((await POST(makeRequest("10.0.0.5"))).status).toBe(504);
  });

  it("returns 500 for other model errors", async () => {
    generateTextMock.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(makeRequest("10.0.0.4"))).status).toBe(500);
  });
});
