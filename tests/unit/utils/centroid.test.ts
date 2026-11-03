import { describe, expect, it } from "vitest";
import { getCentroid, getDistanceMeters } from "@/utils/centroid";

describe("getCentroid", () => {
  it("averages the coordinates of all starts", () => {
    const center = getCentroid([
      { x: "127.0", y: "37.0" },
      { x: "127.2", y: "37.4" },
    ]);

    expect(center?.x).toBeCloseTo(127.1);
    expect(center?.y).toBeCloseTo(37.2);
  });

  it("ignores locations with invalid coordinates", () => {
    expect(getCentroid([{ x: "127.0", y: "37.0" }, { x: "", y: "abc" }])).toEqual({ x: 127, y: 37 });
  });

  it("returns null when there is no valid coordinate", () => {
    expect(getCentroid([])).toBeNull();
  });
});

describe("getDistanceMeters", () => {
  it("measures about 10km between Gangnam and Hongik Univ. stations", () => {
    const d = getDistanceMeters({ x: 127.0276, y: 37.4979 }, { x: 126.9237, y: 37.5572 });
    expect(d).toBeGreaterThan(10_000);
    expect(d).toBeLessThan(12_000);
  });
});
