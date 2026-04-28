import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/kakao", () => ({
  searchPlaces: vi.fn(),
}));

import { searchPlaces } from "@/lib/kakao";
import { GET } from "@/app/api/search/route";

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when q is missing", async () => {
    const req = new NextRequest("http://localhost/api/search");
    const res = await GET(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "검색어(q)가 필요합니다." });
  });

  it("returns 500 when kakao lookup fails", async () => {
    vi.mocked(searchPlaces).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/search?q=gangnam");
    const res = await GET(req);

    expect(searchPlaces).toHaveBeenCalledWith("gangnam");
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "카카오 API 연동 중 오류가 발생했습니다." });
  });

  it("returns search result payload", async () => {
    const payload = {
      meta: { total_count: 1, pageable_count: 1, is_end: true },
      documents: [
        {
          id: "1",
          place_name: "강남역",
          address_name: "서울",
          road_address_name: "서울",
          x: "127.0",
          y: "37.0",
        },
      ],
    };

    vi.mocked(searchPlaces).mockResolvedValueOnce(payload);

    const req = new NextRequest("http://localhost/api/search?q=%EA%B0%95%EB%82%A8");
    const res = await GET(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(payload);
  });
});
