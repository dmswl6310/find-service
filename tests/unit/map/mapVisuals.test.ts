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
  it("marker data URL의 실제 SVG가 kind별 승인 fill·stroke·형태를 사용한다", () => {
    const dataUrlPrefix = "data:image/svg+xml;charset=UTF-8,";
    const originImage = createMapMarkerImage("origin", 1, "default");
    const candidateImage = createMapMarkerImage("candidate", 27, "default");
    const originSvg = decodeURIComponent(originImage.src.slice(dataUrlPrefix.length));
    const candidateSvg = decodeURIComponent(candidateImage.src.slice(dataUrlPrefix.length));

    expect(MAP_DOMAIN_COLORS).toEqual({
      origin: { fill: "#397C8A", stroke: "#235965" },
      candidate: { fill: "#B9604B", stroke: "#843E30" },
    });
    expect(originImage.src).toBe(`${dataUrlPrefix}${encodeURIComponent(originSvg)}`);
    expect(candidateImage.src).toBe(`${dataUrlPrefix}${encodeURIComponent(candidateSvg)}`);
    expect(originSvg).toContain('fill="#397C8A"');
    expect(originSvg).toContain('stroke="#235965"');
    expect(originSvg).not.toContain('fill="#B9604B"');
    expect(originSvg).toContain("<circle");
    expect(originSvg).toContain(">1</text>");
    expect(originSvg).toContain('font-weight="600"');
    expect(originSvg).not.toContain('font-weight="700"');
    expect(candidateSvg).toContain('fill="#B9604B"');
    expect(candidateSvg).toContain('stroke="#843E30"');
    expect(candidateSvg).not.toContain('fill="#397C8A"');
    expect(candidateSvg).toContain("<rect");
    expect(candidateSvg).toContain(">AA</text>");
    expect(candidateSvg).toContain('font-weight="600"');
    expect(candidateSvg).not.toContain('font-weight="700"');
    expect(originSvg).not.toEqual(candidateSvg);
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

  it("원형 출발지는 크기별 중심 offset을 사용하고 후보 핀은 center-bottom 기본값을 유지한다", () => {
    expect(createMapMarkerImage("origin", 1, "default").options).toEqual({
      offset: { x: 17, y: 17 },
    });
    expect(createMapMarkerImage("origin", 1, "active").options).toEqual({
      offset: { x: 20, y: 20 },
    });
    expect(createMapMarkerImage("candidate", 1, "default").options).toBeUndefined();
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
