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
} from "@/lib/nearbyStations";
import type { KakaoLocation, KakaoSearchResponse } from "@/types/kakao";

const starts = [
  { x: "127.0", y: "37.5" },
  { x: "127.1", y: "37.6" },
];

function station(id: string, placeName: string): KakaoLocation {
  return { id, place_name: placeName, address_name: "서울", road_address_name: "", x: "127.05", y: "37.55" };
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

describe("findNearbyStations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches around the centroid and returns up to 20 stations", async () => {
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
    expect(result?.stations).toHaveLength(20);
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
