import { describe, expect, it } from "vitest";
import {
  createMapMarkerImage,
  MAP_DOMAIN_COLORS,
  ROUTE_VISUALS,
} from "@/components/map/mapVisuals";

function decodeMarker(kind: "origin" | "candidate", order: number, state: "default" | "active" | "dimmed") {
  return decodeURIComponent(createMapMarkerImage(kind, order, state).src);
}

describe("지도 시맨틱 시각 요소", () => {
  it("승인된 도메인 색상과 서로 다른 마커 형태·문자를 사용한다", () => {
    const origin = decodeMarker("origin", 1, "default");
    const candidate = decodeMarker("candidate", 27, "default");

    expect(MAP_DOMAIN_COLORS).toEqual({
      origin: { fill: "#397C8A", stroke: "#235965" },
      candidate: { fill: "#B9604B", stroke: "#843E30" },
    });
    expect(origin).toContain("<circle");
    expect(origin).toContain(">1</text>");
    expect(candidate).toContain("<rect");
    expect(candidate).toContain(">AA</text>");
    expect(origin).not.toEqual(candidate);
  });

  it("기본·활성·약화 상태를 크기와 투명도로 구분한다", () => {
    const defaultMarker = createMapMarkerImage("origin", 1, "default");
    const activeMarker = createMapMarkerImage("origin", 1, "active");
    const dimmedMarker = createMapMarkerImage("origin", 1, "dimmed");

    expect(defaultMarker.size).toEqual({ width: 34, height: 34 });
    expect(activeMarker.size).toEqual({ width: 40, height: 40 });
    expect(dimmedMarker.size).toEqual({ width: 32, height: 32 });
    expect(decodeURIComponent(defaultMarker.src)).toContain('opacity="1"');
    expect(decodeURIComponent(activeMarker.src)).toContain('opacity="1"');
    expect(decodeURIComponent(dimmedMarker.src)).toContain('opacity="0.48"');

    expect(createMapMarkerImage("candidate", 1, "default").size).toEqual({ width: 36, height: 44 });
    expect(createMapMarkerImage("candidate", 1, "active").size).toEqual({ width: 42, height: 50 });
    expect(createMapMarkerImage("candidate", 1, "dimmed").size).toEqual({ width: 34, height: 42 });
    expect(decodeMarker("candidate", 1, "dimmed")).toContain('opacity="0.48"');
  });

  it("후보 문자 표기는 Z 다음에 AA로 이어진다", () => {
    expect(decodeMarker("candidate", 1, "default")).toContain(">A</text>");
    expect(decodeMarker("candidate", 26, "default")).toContain(">Z</text>");
    expect(decodeMarker("candidate", 27, "default")).toContain(">AA</text>");
  });

  it("모든 경로 구간을 승인된 시맨틱 토큰에 매핑한다", () => {
    expect(Object.keys(ROUTE_VISUALS).sort()).toEqual(["bus", "subway", "walk"]);
    expect(ROUTE_VISUALS).toEqual({
      walk: { colorToken: "--text-muted", opacity: 0.8, weight: 4, style: "shortdash" },
      bus: { colorToken: "--success", opacity: 0.9, weight: 5, style: "solid" },
      subway: { colorToken: "--origin", opacity: 0.9, weight: 5, style: "solid" },
    });
  });
});
