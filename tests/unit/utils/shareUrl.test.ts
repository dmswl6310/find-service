import { describe, expect, it } from "vitest";
import type { KakaoLocation } from "@/types/kakao";
import { decodeSharedLocations, encodeSharedLocations, toKakaoLocations } from "@/utils/shareUrl";

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
});
