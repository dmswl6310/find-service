import type { KakaoLocation } from "@/types/kakao";

export type SharedLocationPayload = {
  id: string;
  p: string;
  x: string;
  y: string;
};

export type SharedDepartureTimePayload = {
  enabled: boolean;
  date?: string;
  time?: string;
};

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function decodeBase64Utf8(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function encodeSharedLocations(locations: KakaoLocation[]): string {
  const minimalPayload: SharedLocationPayload[] = locations.map((item) => ({
    id: item.id,
    p: item.place_name,
    x: item.x,
    y: item.y,
  }));

  return encodeURIComponent(encodeBase64Utf8(JSON.stringify(minimalPayload)));
}

export function decodeSharedLocations(param: string): SharedLocationPayload[] {
  return JSON.parse(decodeBase64Utf8(decodeURIComponent(param))) as SharedLocationPayload[];
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

export function writeSharedDepartureTimeParams(
  searchParams: URLSearchParams,
  payload: SharedDepartureTimePayload
) {
  searchParams.set("dt", payload.enabled ? "1" : "0");

  if (payload.date) {
    searchParams.set("d", payload.date);
  } else {
    searchParams.delete("d");
  }

  if (payload.time) {
    searchParams.set("t", payload.time);
  } else {
    searchParams.delete("t");
  }
}

export function readSharedDepartureTimeParams(searchParams: URLSearchParams): SharedDepartureTimePayload | null {
  const dt = searchParams.get("dt");
  const rawDate = searchParams.get("d") || undefined;
  const rawTime = searchParams.get("t") || undefined;
  const date = rawDate && /^\d{8}$/.test(rawDate) ? rawDate : undefined;
  const time = rawTime && /^\d{4}$/.test(rawTime) ? rawTime : undefined;

  if (dt === null && !rawDate && !rawTime) {
    return null;
  }

  return {
    enabled: dt !== "0",
    date,
    time,
  };
}
