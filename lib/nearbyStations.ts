import { KAKAO_CATEGORY_PAGE_SIZE, searchSubwayStations } from "@/lib/kakao";
import type { KakaoLocation } from "@/types/kakao";
import { getCentroid, getDistanceMeters, type Coordinate } from "@/utils/centroid";

export const DEFAULT_STATION_RADIUS_M = 3000;
export const EXPANDED_STATION_RADIUS_M = 6000;
// 카카오에서 넉넉히 모은 뒤, 출발지들과의 거리가 고른 역만 AI에게 넘긴다
export const COLLECT_STATION_COUNT = 30;
export const TARGET_STATION_COUNT = 10;
// 이보다 적으면 반경을 한 번 넓혀 다시 찾는다
export const MIN_STATION_COUNT = 5;
// 이미 고른 역에서 이 거리 안에 있는 역은 같은 동네로 보고 뺀다 (예: 용산역·신용산역 약 290m)
export const MIN_STATION_SPACING_M = 500;

export interface NearbyStationsResult {
  center: Coordinate;
  radius: number;
  stations: KakaoLocation[];
}

// "강남역 2호선", "강남역 신분당선"처럼 노선별로 나뉜 결과를 역 이름 하나로 묶기 위한 키
export function getStationBaseName(placeName: string): string {
  return placeName.trim().split(/\s+/)[0] ?? placeName;
}

function dedupeByStationName(stations: KakaoLocation[]): KakaoLocation[] {
  const seen = new Set<string>();
  return stations.filter((station) => {
    const key = getStationBaseName(station.place_name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 거리순으로 페이지를 넘기며 서로 다른 역을 target개까지 모은다. API 실패 시 null.
async function collectStations(center: Coordinate, radius: number, target: number): Promise<KakaoLocation[] | null> {
  const collected: KakaoLocation[] = [];
  const maxPages = Math.ceil((target * 2) / KAKAO_CATEGORY_PAGE_SIZE);

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await searchSubwayStations({ x: center.x, y: center.y, radius, page });
    if (!response) return null;

    collected.push(...response.documents);
    if (dedupeByStationName(collected).length >= target || response.meta.is_end) break;
  }

  return dedupeByStationName(collected).slice(0, target);
}

// 가장 먼 출발지까지의 직선거리가 짧은 역부터. 같으면 거리 합이 짧은 역부터.
// ODsay를 부르지 않고 "한쪽만 가까운 역"을 걸러 내는 근사치다. 실제 이동시간 순위는 기존 비교가 매긴다.
export function rankStationsByFairDistance(
  stations: KakaoLocation[],
  starts: Coordinate[]
): KakaoLocation[] {
  const scored = stations.map((station) => {
    const point = { x: Number(station.x), y: Number(station.y) };
    const distances = starts.map((start) => getDistanceMeters(point, start));
    return {
      station,
      max: Math.max(...distances),
      sum: distances.reduce((acc, d) => acc + d, 0),
    };
  });
  return scored.sort((a, b) => a.max - b.max || a.sum - b.sum).map((item) => item.station);
}

// 앞(더 공평한 역)부터 차례로 담되, 이미 담은 역과 너무 가까운 역은 건너뛴다
export function spreadOutStations(stations: KakaoLocation[], minSpacingM = MIN_STATION_SPACING_M): KakaoLocation[] {
  const picked: KakaoLocation[] = [];
  for (const station of stations) {
    const point = { x: Number(station.x), y: Number(station.y) };
    const tooClose = picked.some(
      (other) => getDistanceMeters(point, { x: Number(other.x), y: Number(other.y) }) < minSpacingM
    );
    if (!tooClose) picked.push(station);
  }
  return picked;
}

export async function findNearbyStations(
  starts: Pick<KakaoLocation, "x" | "y">[]
): Promise<NearbyStationsResult | null> {
  // 중심점은 "어느 동네에서 역을 찾을지"만 정한다
  const center = getCentroid(starts);
  if (!center) return null;
  const startPoints = starts.map((start) => ({ x: Number(start.x), y: Number(start.y) }));
  const pick = (stations: KakaoLocation[]) =>
    spreadOutStations(rankStationsByFairDistance(stations, startPoints)).slice(0, TARGET_STATION_COUNT);

  const stations = await collectStations(center, DEFAULT_STATION_RADIUS_M, COLLECT_STATION_COUNT);
  if (!stations) return null;
  if (stations.length >= MIN_STATION_COUNT) {
    return { center, radius: DEFAULT_STATION_RADIUS_M, stations: pick(stations) };
  }

  const expanded = await collectStations(center, EXPANDED_STATION_RADIUS_M, COLLECT_STATION_COUNT);
  if (!expanded) return null;
  return { center, radius: EXPANDED_STATION_RADIUS_M, stations: pick(expanded) };
}
