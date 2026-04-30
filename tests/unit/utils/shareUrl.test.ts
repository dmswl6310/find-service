import { describe, expect, it } from "vitest";
import type { KakaoLocation } from "@/types/kakao";
import {
  decodeSharedLocations,
  encodeSharedLocations,
  readSharedDepartureTimeParams,
  toKakaoLocations,
  writeSharedDepartureTimeParams,
} from "@/utils/shareUrl";

describe("shareUrl", () => {
  it("round-trips Korean place names with UTF-8 safe encoding", () => {
    const locations: KakaoLocation[] = [
      {
        address_name: "서울 강남구",
        id: "강남-id",
        place_name: "강남역",
        road_address_name: "서울 강남구 강남대로",
        x: "127.0276",
        y: "37.4979",
      },
    ];

    const encoded = encodeSharedLocations(locations);
    const decoded = decodeSharedLocations(encoded);

    expect(decoded).toEqual([
      {
        id: "강남-id",
        p: "강남역",
        x: "127.0276",
        y: "37.4979",
      },
    ]);
    expect(toKakaoLocations(decoded)[0]).toMatchObject({
      id: "강남-id",
      place_name: "강남역",
      x: "127.0276",
      y: "37.4979",
    });
  });

  it("writes and reads departure time share params", () => {
    const params = new URLSearchParams();

    writeSharedDepartureTimeParams(params, {
      enabled: true,
      date: "20260430",
      time: "1830",
    });

    expect(params.get("dt")).toBe("1");
    expect(params.get("d")).toBe("20260430");
    expect(params.get("t")).toBe("1830");
    expect(readSharedDepartureTimeParams(params)).toEqual({
      enabled: true,
      date: "20260430",
      time: "1830",
    });
  });
});
