import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

export function makeLocation(id: string, name: string): KakaoLocation {
  return {
    id,
    place_name: name,
    address_name: "서울",
    road_address_name: "서울",
    x: "127.0",
    y: "37.5",
  };
}

export function makeRoute(fromId: string, toId: string, timeMn: number): TransitFetchResult {
  return { fromId, toId, timeMn, payment: 1400, pathType: 3, transitCount: 1, subPath: [] };
}

export function makeFailedRoute(fromId: string, toId: string): TransitFetchResult {
  return {
    fromId,
    toId,
    timeMn: -1,
    payment: 0,
    pathType: 0,
    error: true,
    errorMessage: "경로 없음",
  };
}
