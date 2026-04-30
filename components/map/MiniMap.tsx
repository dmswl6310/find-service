"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import { KakaoLocation } from "@/types/kakao";

const MAP_LOAD_TIMEOUT_MS = 8000;

type MapPathPoint = { lat: number; lng: number };
type MapRouteSegment = {
  kind: "walk" | "bus" | "subway";
  path: MapPathPoint[];
};

interface MiniMapProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  routeSegments?: MapRouteSegment[];
  detailedPath?: MapPathPoint[];
  selectedStartId?: string;
  selectedEndId?: string;
}

function createMarkerImage(
  kind: "start" | "end",
  order: number,
  state: "default" | "active" | "muted"
) {
  const palette = {
    start: { fill: "#0EA5E9", stroke: "#0369A1" },
    end: { fill: "#10B981", stroke: "#047857" },
  }[kind];
  const opacity = state === "muted" ? 0.55 : 1;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 2C9.716 2 3 8.716 3 17c0 11.25 15 27 15 27s15-15.75 15-27C33 8.716 26.284 2 18 2z" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2" opacity="${opacity}"/>
      <circle cx="18" cy="17" r="10" fill="white" fill-opacity="0.96"/>
      <text x="18" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="${palette.stroke}">${order}</text>
    </svg>
  `.trim();

  return {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    size: { width: 36, height: 46 },
  };
}

export default function MiniMap({
  starts,
  ends,
  routeSegments = [],
  detailedPath = [],
  selectedStartId,
  selectedEndId,
}: MiniMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const hasSelectedRoute = Boolean(selectedStartId && selectedEndId);
  const segmentPoints = routeSegments.flatMap((segment) => segment.path);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoadFailed(true);
    }, MAP_LOAD_TIMEOUT_MS);

    // kakao.maps가 로드되었는지 확인
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        window.clearTimeout(timeoutId);
        setIsLoaded(true);
        setLoadFailed(false);
      });
    }

    return () => window.clearTimeout(timeoutId);
  }, []);

  // 마커나 폴리라인이 변경될 때마다 지도의 중심과 확대 레벨을 조정
  useEffect(() => {
    if (!map || (starts.length === 0 && ends.length === 0 && segmentPoints.length === 0 && detailedPath.length === 0)) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasPoint = false;

    if (detailedPath.length > 1) {
      detailedPath.forEach((pos) => {
        bounds.extend(new window.kakao.maps.LatLng(pos.lat, pos.lng));
      });

      map.setBounds(bounds);
      return;
    }

    starts.forEach((loc) => {
      bounds.extend(new window.kakao.maps.LatLng(Number(loc.y), Number(loc.x)));
      hasPoint = true;
    });

    ends.forEach((loc) => {
      bounds.extend(new window.kakao.maps.LatLng(Number(loc.y), Number(loc.x)));
      hasPoint = true;
    });

    // 선택된 경로가 아직 선으로 그려지지 않은 경우에는 전체 출발지/목적지를 기준으로 보여줍니다.
    if (segmentPoints.length > 0) {
      segmentPoints.forEach((pos) => {
        bounds.extend(new window.kakao.maps.LatLng(pos.lat, pos.lng));
      });
      hasPoint = true;
    }

    if (hasPoint) {
      map.setBounds(bounds);
      
      // 약간의 여백을 두기 위해 확대 레벨을 조정할 수 있다면 좋겠지만 
      // setBounds 자체로 충분한 패딩이 적용됩니다.
    }
  }, [map, starts, ends, segmentPoints, detailedPath]);

  const segmentStyles: Record<MapRouteSegment["kind"], { color: string; opacity: number; weight: number; style: kakao.maps.StrokeStyles }> = {
    walk: { color: "#6B7280", opacity: 0.8, weight: 4, style: "shortdash" },
    bus: { color: "#16A34A", opacity: 0.9, weight: 5, style: "solid" },
    subway: { color: "#2563EB", opacity: 0.9, weight: 5, style: "solid" },
  };

  if (loadFailed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface border border-border rounded-xl aspect-square md:aspect-auto px-6 text-center" role="status" aria-live="polite">
        <p className="text-sm font-semibold text-foreground">지도를 불러오지 못했습니다.</p>
        <p className="text-xs leading-5 text-foreground/60">네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface border border-border rounded-xl aspect-square md:aspect-auto" role="status" aria-live="polite" aria-busy="true">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="sr-only">지도를 불러오는 중입니다.</span>
      </div>
    );
  }

  const defaultCenter = { lat: 37.5665, lng: 126.9780 }; // 서울시청 기본값

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border shadow-sm min-h-[400px]">
      <Map
        center={defaultCenter}
        style={{ width: "100%", height: "100%" }}
        level={6}
        onCreate={setMap}
      >
        {starts.map((loc, index) => {
          const isActive = loc.id === selectedStartId;
          const markerState = hasSelectedRoute ? (isActive ? "active" : "muted") : "default";

          return (
          <MapMarker
            key={`start-${loc.id}`}
            position={{ lat: Number(loc.y), lng: Number(loc.x) }}
            title={loc.place_name}
            image={createMarkerImage("start", index + 1, markerState)}
          >
            {isActive && (
              <div className="rounded-xl border border-sky-500 bg-white px-2 py-1 text-xs font-semibold whitespace-nowrap text-sky-950 shadow-md">
                {loc.place_name}
              </div>
            )}
          </MapMarker>
          );
        })}
        {ends.map((loc, index) => {
          const isActive = loc.id === selectedEndId;
          const markerState = hasSelectedRoute ? (isActive ? "active" : "muted") : "default";

          return (
          <MapMarker
            key={`end-${loc.id}`}
            position={{ lat: Number(loc.y), lng: Number(loc.x) }}
            title={loc.place_name}
            image={createMarkerImage("end", index + 1, markerState)}
          >
            {isActive && (
              <div className="rounded-xl border border-emerald-500 bg-white px-2 py-1 text-xs font-semibold whitespace-nowrap text-emerald-950 shadow-md">
                {loc.place_name}
              </div>
            )}
          </MapMarker>
          );
        })}
        
        {detailedPath.length > 1 && (
          <Polyline
            path={detailedPath}
            strokeWeight={7}
            strokeColor={"#111827"}
            strokeOpacity={0.12}
            strokeStyle={"solid"}
          />
        )}

        {routeSegments.map((segment, index) => {
          const style = segmentStyles[segment.kind];

          return (
            <Polyline
              key={`${segment.kind}-${index}`}
              path={segment.path}
              strokeWeight={style.weight}
              strokeColor={style.color}
              strokeOpacity={style.opacity}
              strokeStyle={style.style}
            />
          );
        })}
      </Map>
    </div>
  );
}
