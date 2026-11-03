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

const EARTH_RADIUS_M = 6_371_000;

// 두 좌표 사이 직선거리(m), 하버사인 공식
export function getDistanceMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.y - a.y);
  const dLng = toRad(b.x - a.x);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.y)) * Math.cos(toRad(b.y)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
