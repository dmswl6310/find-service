import { describe, expect, it } from "vitest";
import { getCentroid } from "@/utils/centroid";

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
