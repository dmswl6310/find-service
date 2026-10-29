import { KAKAO_CATEGORY_PAGE_SIZE, searchSubwayStations } from "@/lib/kakao";
import type { KakaoLocation } from "@/types/kakao";
import { getCentroid, type Coordinate } from "@/utils/centroid";

export const DEFAULT_STATION_RADIUS_M = 3000;
export const EXPANDED_STATION_RADIUS_M = 6000;
export const TARGET_STATION_COUNT = 20;
// 이보다 적으면 반경을 한 번 넓혀 다시 찾는다
export const MIN_STATION_COUNT = 5;

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

export async function findNearbyStations(
  starts: Pick<KakaoLocation, "x" | "y">[]
): Promise<NearbyStationsResult | null> {
  const center = getCentroid(starts);
  if (!center) return null;

  const stations = await collectStations(center, DEFAULT_STATION_RADIUS_M, TARGET_STATION_COUNT);
  if (!stations) return null;
  if (stations.length >= MIN_STATION_COUNT) {
    return { center, radius: DEFAULT_STATION_RADIUS_M, stations };
  }

  const expanded = await collectStations(center, EXPANDED_STATION_RADIUS_M, TARGET_STATION_COUNT);
  if (!expanded) return null;
  return { center, radius: EXPANDED_STATION_RADIUS_M, stations: expanded };
}
