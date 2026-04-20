"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import { KakaoLocation } from "@/types/kakao";

interface MiniMapProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  polylinePath?: { lat: number; lng: number }[];
}

export default function MiniMap({ starts, ends, polylinePath = [] }: MiniMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  useEffect(() => {
    // kakao.maps가 로드되었는지 확인
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    }
  }, []);

  // 마커나 폴리라인이 변경될 때마다 지도의 중심과 확대 레벨을 조정
  useEffect(() => {
    if (!map || (starts.length === 0 && ends.length === 0 && polylinePath.length === 0)) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasPoint = false;

    starts.forEach((loc) => {
      bounds.extend(new window.kakao.maps.LatLng(Number(loc.y), Number(loc.x)));
      hasPoint = true;
    });

    ends.forEach((loc) => {
      bounds.extend(new window.kakao.maps.LatLng(Number(loc.y), Number(loc.x)));
      hasPoint = true;
    });

    // 선택된 경로가 있을 경우 해당 경로가 잘 보이도록 마진(패딩)을 줄 수 있게 포인트를 포함
    if (polylinePath && polylinePath.length > 0) {
      polylinePath.forEach((pos) => {
        bounds.extend(new window.kakao.maps.LatLng(pos.lat, pos.lng));
      });
      hasPoint = true;
    }

    if (hasPoint) {
      map.setBounds(bounds);
      
      // 약간의 여백을 두기 위해 확대 레벨을 조정할 수 있다면 좋겠지만 
      // setBounds 자체로 충분한 패딩이 적용됩니다.
    }
  }, [map, starts, ends, polylinePath]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface border border-border rounded-xl aspect-square md:aspect-auto">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        {starts.map((loc) => (
          <MapMarker
            key={`start-${loc.id}`}
            position={{ lat: Number(loc.y), lng: Number(loc.x) }}
            title={loc.place_name}
            image={{
              src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png", // 카카오맵 기본 빨간 마커
              size: { width: 24, height: 35 },
            }}
          >
            <div className="px-2 py-1 bg-white text-black text-xs font-semibold whitespace-nowrap border-blue-500 border rounded shadow-md">
              {loc.place_name}
            </div>
          </MapMarker>
        ))}
        {ends.map((loc) => (
          <MapMarker
            key={`end-${loc.id}`}
            position={{ lat: Number(loc.y), lng: Number(loc.x) }}
            title={loc.place_name}
            image={{
              src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png", // 별모양 마커 (도착지)
              size: { width: 24, height: 35 },
            }}
          >
            <div className="px-2 py-1 bg-white text-black text-xs font-semibold whitespace-nowrap border-red-500 border rounded shadow-md">
              {loc.place_name}
            </div>
          </MapMarker>
        ))}
        
        {/* 그려질 경로 선 */}
        {polylinePath && polylinePath.length > 0 && (
          <Polyline
            path={polylinePath}
            strokeWeight={5} // 선의 두께
            strokeColor={"#4F46E5"} // Indigo 색상 기반 (primary)
            strokeOpacity={0.8} // 선의 불투명도
            strokeStyle={"solid"} // 선의 스타일
          />
        )}
      </Map>
    </div>
  );
}
