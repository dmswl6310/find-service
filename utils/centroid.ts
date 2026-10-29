import type { KakaoLocation } from "@/types/kakao";

export interface Coordinate {
  x: number; // 경도
  y: number; // 위도
}

// 출발지들의 산술 평균 좌표. 서울·수도권 범위에서는 구면 보정 없이도 오차가 작다.
export function getCentroid(locations: Pick<KakaoLocation, "x" | "y">[]): Coordinate | null {
  const points = locations
    .map((location) => ({ x: Number(location.x), y: Number(location.y) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (points.length === 0) return null;

  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
