import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("GET /api/transit/graphic", () => {
  const originalApiKey = process.env.ODSAY_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.ODSAY_API_KEY = "test-odsay-key";
  });

  afterEach(() => {
    process.env.ODSAY_API_KEY = originalApiKey;
  });

  it("returns 400 when mapObj is missing", async () => {
    const { GET } = await import("@/app/api/transit/graphic/route");
    const req = new NextRequest("http://localhost/api/transit/graphic");
    const res = await GET(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "mapObj 파라미터가 필요합니다." });
  });

  it("returns 500 when API key is missing", async () => {
    process.env.ODSAY_API_KEY = "";

    const { GET } = await import("@/app/api/transit/graphic/route");
    const req = new NextRequest("http://localhost/api/transit/graphic?mapObj=abc");
    const res = await GET(req);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "API 키가 설정되지 않았습니다." });
  });

  it("normalizes mapObj and returns graphic payload", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result: {
            lane: [
              {
                section: [{ graphPos: [{ x: "126.1", y: "37.1" }, { x: "126.2", y: "37.2" }] }],
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { GET } = await import("@/app/api/transit/graphic/route");
    const req = new NextRequest("http://localhost/api/transit/graphic?mapObj=abc");
    const res = await GET(req);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(String(calledUrl)).toContain("mapObject=0:0@abc");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ result: { lane: expect.any(Array) } });
  });

  it("maps upstream graphic error payload to 502", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "-1", msg: "bad mapObj" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { GET } = await import("@/app/api/transit/graphic/route");
    const req = new NextRequest("http://localhost/api/transit/graphic?mapObj=abc");
    const res = await GET(req);

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      error: "bad mapObj",
      errorCode: "-1",
    });
  });
});
