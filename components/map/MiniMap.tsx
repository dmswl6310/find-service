"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import MapFailureState from "@/components/map/MapFailureState";
import { createMapMarkerImage, ROUTE_VISUALS } from "@/components/map/mapVisuals";
import { KakaoLocation } from "@/types/kakao";
import { buildKakaoSdkScriptUrl, getKakaoJsApiKey } from "@/lib/external-config";

const MAP_LOAD_TIMEOUT_MS = 8000;

export type MapPathPoint = { lat: number; lng: number };
export type MapRouteSegment = {
  kind: "walk" | "bus" | "subway";
  path: MapPathPoint[];
};

export interface MiniMapProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  routeSegments?: MapRouteSegment[];
  detailedPath?: MapPathPoint[];
  selectedStartId?: string;
  selectedEndId?: string;
  onMount?: () => void;
}

function resolveCssColor(token: string) {
  return window.getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

export default function MiniMap({
  starts,
  ends,
  routeSegments = [],
  detailedPath = [],
  selectedStartId,
  selectedEndId,
  onMount,
}: MiniMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const kakaoScriptUrl = buildKakaoSdkScriptUrl(getKakaoJsApiKey());
  const hasSelectedRoute = Boolean(selectedStartId && selectedEndId);
  const segmentPoints = routeSegments.flatMap((segment) => segment.path);

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoadFailed(true);
    }, MAP_LOAD_TIMEOUT_MS);

    if (scriptReady && typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        window.clearTimeout(timeoutId);
        setIsLoaded(true);
        setLoadFailed(false);
      });
    }

    return () => window.clearTimeout(timeoutId);
  }, [scriptReady]);

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

  if (loadFailed) {
    return (
      <>
        <Script src={kakaoScriptUrl} strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setLoadFailed(true)} />
        <MapFailureState />
      </>
    );
  }

  if (!isLoaded) {
    return (
      <>
        <Script src={kakaoScriptUrl} strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setLoadFailed(true)} />
        <div className="w-full h-full flex items-center justify-center bg-surface border border-border rounded-lg aspect-square md:aspect-auto" role="status" aria-live="polite" aria-busy="true">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-action border-t-transparent"></div>
          <span className="sr-only">지도를 불러오는 중입니다.</span>
        </div>
      </>
    );
  }

  const defaultCenter = { lat: 37.5665, lng: 126.9780 }; // 서울시청 기본값

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border min-h-[400px]">
      <Script src={kakaoScriptUrl} strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setLoadFailed(true)} />
      <Map
        center={defaultCenter}
        style={{ width: "100%", height: "100%" }}
        level={6}
        onCreate={setMap}
      >
        {starts.map((loc, index) => {
          const isActive = loc.id === selectedStartId;
          const markerState = hasSelectedRoute ? (isActive ? "active" : "dimmed") : "default";

          return (
          <MapMarker
            key={`start-${loc.id}`}
            position={{ lat: Number(loc.y), lng: Number(loc.x) }}
            title={loc.place_name}
            image={createMapMarkerImage("origin", index + 1, markerState)}
          >
            {isActive && (
              <div className="whitespace-nowrap rounded-xl border border-origin bg-surface px-2 py-1 text-xs font-semibold text-origin shadow-md">
                {loc.place_name}
              </div>
            )}
          </MapMarker>
          );
        })}
        {ends.map((loc, index) => {
          const isActive = loc.id === selectedEndId;
          const markerState = hasSelectedRoute ? (isActive ? "active" : "dimmed") : "default";

          return (
          <MapMarker
            key={`end-${loc.id}`}
            position={{ lat: Number(loc.y), lng: Number(loc.x) }}
            title={loc.place_name}
            image={createMapMarkerImage("candidate", index + 1, markerState)}
          >
            {isActive && (
              <div className="whitespace-nowrap rounded-xl border border-candidate bg-surface px-2 py-1 text-xs font-semibold text-candidate shadow-md">
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
            strokeColor={resolveCssColor("--text")}
            strokeOpacity={0.12}
            strokeStyle={"solid"}
          />
        )}

        {routeSegments.map((segment, index) => {
          const style = ROUTE_VISUALS[segment.kind];

          return (
            <Polyline
              key={`${segment.kind}-${index}`}
              path={segment.path}
              strokeWeight={style.weight}
              strokeColor={resolveCssColor(style.colorToken)}
              strokeOpacity={style.opacity}
              strokeStyle={style.style as kakao.maps.StrokeStyles}
            />
          );
        })}
      </Map>
    </div>
  );
}
