import { KakaoLocation } from "@/types/kakao";
import { OdsayGraphicResponse, OdsaySubPath, TransitFetchResult } from "@/types/odsay";

export type MapPathPoint = { lat: number; lng: number };
export type MapRouteSegment = {
  kind: "walk" | "bus" | "subway";
  path: MapPathPoint[];
};

function toMapPathPoint(lat: string | number | undefined, lng: string | number | undefined): MapPathPoint | null {
  if (lat === undefined || lng === undefined) return null;

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;

  return { lat: parsedLat, lng: parsedLng };
}

function pushUniquePoint(points: MapPathPoint[], point: MapPathPoint | null) {
  if (!point) return;

  const lastPoint = points[points.length - 1];
  if (lastPoint?.lat === point.lat && lastPoint.lng === point.lng) return;

  points.push(point);
}

export function extractGraphicPath(data: OdsayGraphicResponse): MapPathPoint[] {
  const points: MapPathPoint[] = [];
  const lanes = Array.isArray(data.result?.lane) ? data.result.lane : [];

  lanes.forEach((lane) => {
    lane.section?.forEach((section) => {
      section.graphPos?.forEach((pos) => {
        pushUniquePoint(points, toMapPathPoint(pos.y, pos.x));
      });
    });
  });

  return points;
}

export function buildFallbackPath(
  route: TransitFetchResult,
  starts: KakaoLocation[],
  ends: KakaoLocation[]
): MapPathPoint[] {
  const points: MapPathPoint[] = [];
  const startLocation = starts.find((loc) => loc.id === route.fromId);
  const endLocation = ends.find((loc) => loc.id === route.toId);

  pushUniquePoint(points, toMapPathPoint(startLocation?.y, startLocation?.x));

  route.subPath?.forEach((path) => {
    pushUniquePoint(points, toMapPathPoint(path.startY, path.startX));

    path.passStopList?.stations?.forEach((station) => {
      pushUniquePoint(points, toMapPathPoint(station.y, station.x));
    });

    pushUniquePoint(points, toMapPathPoint(path.endY, path.endX));
  });

  pushUniquePoint(points, toMapPathPoint(endLocation?.y, endLocation?.x));

  if (points.length >= 2) return points;

  const directStart = toMapPathPoint(startLocation?.y, startLocation?.x);
  const directEnd = toMapPathPoint(endLocation?.y, endLocation?.x);

  return [directStart, directEnd].filter((point): point is MapPathPoint => point !== null);
}

function getSegmentKind(path: OdsaySubPath): MapRouteSegment["kind"] {
  if (path.trafficType === 1) return "subway";
  if (path.trafficType === 2) return "bus";
  return "walk";
}

function buildSegmentPath(
  path: OdsaySubPath,
  previousPath: OdsaySubPath | undefined,
  nextPath: OdsaySubPath | undefined,
  startLocation?: KakaoLocation,
  endLocation?: KakaoLocation
): MapPathPoint[] {
  const points: MapPathPoint[] = [];

  const fallbackStart =
    toMapPathPoint(path.startY, path.startX) ??
    toMapPathPoint(previousPath?.endY, previousPath?.endX) ??
    toMapPathPoint(nextPath?.startY, nextPath?.startX) ??
    toMapPathPoint(startLocation?.y, startLocation?.x);

  const fallbackEnd =
    toMapPathPoint(path.endY, path.endX) ??
    toMapPathPoint(nextPath?.startY, nextPath?.startX) ??
    toMapPathPoint(previousPath?.endY, previousPath?.endX) ??
    toMapPathPoint(endLocation?.y, endLocation?.x);

  pushUniquePoint(points, fallbackStart);

  path.passStopList?.stations?.forEach((station) => {
    pushUniquePoint(points, toMapPathPoint(station.y, station.x));
  });

  pushUniquePoint(points, fallbackEnd);

  return points;
}

export function buildRouteSegments(
  route: TransitFetchResult,
  starts: KakaoLocation[],
  ends: KakaoLocation[]
): MapRouteSegment[] {
  const startLocation = starts.find((loc) => loc.id === route.fromId);
  const endLocation = ends.find((loc) => loc.id === route.toId);

  return (
    route.subPath
      ?.map((path, index, allPaths) => ({
        kind: getSegmentKind(path),
        path: buildSegmentPath(path, allPaths[index - 1], allPaths[index + 1], startLocation, endLocation),
      }))
      .filter((segment) => segment.path.length >= 2) ?? []
  );
}
