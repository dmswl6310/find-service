import type { KakaoLocation } from "@/types/kakao";

export type SharedLocationPayload = {
  id: string;
  p: string;
  x: string;
  y: string;
};

export function encodeSharedLocations(locations: KakaoLocation[]): string {
  const minimalPayload: SharedLocationPayload[] = locations.map((item) => ({
    id: item.id,
    p: item.place_name,
    x: item.x,
    y: item.y,
  }));

  return encodeURIComponent(btoa(JSON.stringify(minimalPayload)));
}

export function decodeSharedLocations(param: string): SharedLocationPayload[] {
  return JSON.parse(atob(decodeURIComponent(param))) as SharedLocationPayload[];
}

export function toKakaoLocations(payload: SharedLocationPayload[]): KakaoLocation[] {
  return payload.map((item) => ({
    id: item.id,
    place_name: item.p,
    x: item.x,
    y: item.y,
    address_name: "",
    road_address_name: "",
  }));
}
