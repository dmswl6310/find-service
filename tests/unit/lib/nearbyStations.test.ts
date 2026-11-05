import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/kakao", () => ({
  KAKAO_CATEGORY_PAGE_SIZE: 15,
  searchSubwayStations: vi.fn(),
}));

import { searchSubwayStations } from "@/lib/kakao";
import {
  DEFAULT_STATION_RADIUS_M,
  EXPANDED_STATION_RADIUS_M,
  findNearbyStations,
  getStationBaseName,
  rankStationsByFairDistance,
  spreadOutStations,
  TARGET_STATION_COUNT,
} from "@/lib/nearbyStations";
import type { KakaoLocation, KakaoSearchResponse } from "@/types/kakao";

const starts = [
  { x: "127.0", y: "37.5" },
  { x: "127.1", y: "37.6" },
];

// 역마다 약 1km씩 떨어진 좌표를 줘서, 거리 간격 필터에 걸리지 않게 한다
let nextStationOffset = 0;
function station(id: string, placeName: string): KakaoLocation {
  const x = (127.0 + nextStationOffset * 0.012).toFixed(4);
  nextStationOffset += 1;
  return { id, place_name: placeName, address_name: "서울", road_address_name: "", x, y: "37.55" };
}

function page(documents: KakaoLocation[], isEnd: boolean): KakaoSearchResponse {
  return { meta: { total_count: documents.length, pageable_count: documents.length, is_end: isEnd }, documents };
}

function stations(count: number, prefix = "역"): KakaoLocation[] {
  return Array.from({ length: count }, (_, i) => station(`${prefix}${i}`, `${prefix}${i}역 1호선`));
}

describe("getStationBaseName", () => {
  it("drops the line name", () => {
    expect(getStationBaseName("강남역 신분당선")).toBe("강남역");
  });
});

describe("rankStationsByFairDistance", () => {
  it("puts the station that is fair to every start ahead of one close to a single start", () => {
    const gangnam = { x: 127.0276, y: 37.4979 };
    const hongdae = { x: 126.9237, y: 37.5572 };
    const nearGangnam = { ...station("a", "신논현역 9호선"), x: "127.0250", y: "37.5046" };
    const between = { ...station("b", "동작역 4호선"), x: "126.9801", y: "37.5028" };

    const ranked = rankStationsByFairDistance([nearGangnam, between], [gangnam, hongdae]);

    expect(ranked.map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("spreadOutStations", () => {
  it("drops a station within 500m of one already picked, keeping the earlier one", () => {
    const yongsan = { ...station("1", "용산역 경의중앙선"), x: "126.96475753", y: "37.52960692" };
    const sinyongsan = { ...station("2", "신용산역 4호선"), x: "126.96796504", y: "37.52925915" };
    const itaewon = { ...station("3", "이태원역 6호선"), x: "126.99433386", y: "37.53452520" };

    expect(spreadOutStations([yongsan, sinyongsan, itaewon]).map((s) => s.id)).toEqual(["1", "3"]);
  });
});

describe("findNearbyStations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches around the centroid and returns the target number of stations", async () => {
    vi.mocked(searchSubwayStations)
      .mockResolvedValueOnce(page(stations(15, "a"), false))
      .mockResolvedValueOnce(page(stations(15, "b"), false));

    const result = await findNearbyStations(starts);

    expect(searchSubwayStations).toHaveBeenNthCalledWith(1, {
      x: expect.closeTo(127.05),
      y: expect.closeTo(37.55),
      radius: DEFAULT_STATION_RADIUS_M,
      page: 1,
    });
    expect(result?.radius).toBe(DEFAULT_STATION_RADIUS_M);
    expect(result?.stations).toHaveLength(TARGET_STATION_COUNT);
  });

  it("merges the same station on different lines into one", async () => {
    vi.mocked(searchSubwayStations).mockResolvedValueOnce(
      page(
        [
          station("1", "강남역 2호선"),
          station("2", "강남역 신분당선"),
          ...stations(5),
        ],
        true
      )
    );

    const result = await findNearbyStations(starts);

    expect(result?.stations.map((s) => s.id)).toEqual(["1", "역0", "역1", "역2", "역3", "역4"]);
  });

  it("widens the radius once when too few stations are nearby", async () => {
    vi.mocked(searchSubwayStations)
      .mockResolvedValueOnce(page(stations(2), true))
      .mockResolvedValueOnce(page(stations(8), true));

    const result = await findNearbyStations(starts);

    expect(searchSubwayStations).toHaveBeenLastCalledWith(
      expect.objectContaining({ radius: EXPANDED_STATION_RADIUS_M, page: 1 })
    );
    expect(result?.radius).toBe(EXPANDED_STATION_RADIUS_M);
    expect(result?.stations).toHaveLength(8);
  });

  it("returns null when the Kakao request fails", async () => {
    vi.mocked(searchSubwayStations).mockResolvedValueOnce(null);

    await expect(findNearbyStations(starts)).resolves.toBeNull();
  });

  it("returns null without calling Kakao when no start has coordinates", async () => {
    await expect(findNearbyStations([])).resolves.toBeNull();
    expect(searchSubwayStations).not.toHaveBeenCalled();
  });
});
