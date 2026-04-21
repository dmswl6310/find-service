"use client";

import { useEffect, Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LocationInput from "@/components/search/LocationInput";
import ResultTable from "@/components/result/ResultTable";
import TimeFilter from "@/components/search/TimeFilter";
import ShareButton from "@/components/search/ShareButton";
import MiniMap from "@/components/map/MiniMap";
import { useAppStore } from "@/store/useAppStore";
import { useTransitMatrix } from "@/hooks/useTransitMatrix";
import { KakaoLocation } from "@/types/kakao";
import { OdsayGraphicResponse, TransitFetchResult } from "@/types/odsay";

type MapPathPoint = { lat: number; lng: number };

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

function extractGraphicPath(data: OdsayGraphicResponse): MapPathPoint[] {
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

function buildFallbackPath(
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

// URL 쿼리 동기화 및 자동 실행 담당 컴포넌트
function RouteSync() {
  const searchParams = useSearchParams();
  const { starts, ends, setStarts, setEnds, targetDate, targetTime } = useAppStore();
  const { calculateMatrix } = useTransitMatrix();

  const handleCalculate = useCallback((s: KakaoLocation[], e: KakaoLocation[]) => {
    if (s.length > 0 && e.length > 0) {
      calculateMatrix(s, e, targetDate, targetTime);
    }
  }, [calculateMatrix, targetDate, targetTime]);

  useEffect(() => {
    // URL에 데이터가 있으면 디코딩해서 불러오기
    const sParam = searchParams.get("s");
    const eParam = searchParams.get("e");

    if (sParam && eParam) {
      try {
        const decodedStarts = JSON.parse(atob(decodeURIComponent(sParam)));
        const decodedEnds = JSON.parse(atob(decodeURIComponent(eParam)));
        
        const mappedStarts: KakaoLocation[] = decodedStarts.map((item: any) => ({
          id: item.id,
          place_name: item.p,
          x: item.x,
          y: item.y,
          address_name: "", // 옵셔널 처리 또는 기본값
        }));
        
        const mappedEnds: KakaoLocation[] = decodedEnds.map((item: any) => ({
          id: item.id,
          place_name: item.p,
          x: item.x,
          y: item.y,
          address_name: "",
        }));

        setStarts(mappedStarts);
        setEnds(mappedEnds);

        // 초기 URL 로드 시 바로 계산 시작
        handleCalculate(mappedStarts, mappedEnds);
        
        // URL에서 쿼리스트링 제거 (깔끔한 URL 유지) - 선택사항이지만 남겨두면 새로고침 시 다시 동작하므로 유지
      } catch (err) {
        console.error("Failed to parse shared URL:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시에만 실행

  return null;
}

function MainContent() {
  const { starts, ends, addStart, removeStart, addEnd, removeEnd, targetDate, targetTime } = useAppStore();
  const { matrixData, isCalculating, calculateMatrix, error } = useTransitMatrix();
  const [activeMapRouteId, setActiveMapRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransitFetchResult | null>(null);
  const [polylinePath, setPolylinePath] = useState<{ lat: number; lng: number }[]>([]);

  const fairestEndId = useMemo(() => {
    if (starts.length < 2 || ends.length < 2 || matrixData.length === 0) return null;

    const scores = ends.map((end) => {
      const colResults = matrixData.filter((d) => d.toId === end.id && !d.error && d.timeMn >= 0);
      if (colResults.length !== starts.length) return { id: end.id, score: Infinity };

      const times = colResults.map((d) => d.timeMn);
      const max = Math.max(...times);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;

      return { id: end.id, score: max + avg };
    });

    const validScores = scores.filter((s) => s.score !== Infinity);
    if (validScores.length === 0) return null;

    const minScore = Math.min(...validScores.map((s) => s.score));
    return validScores.find((s) => s.score === minScore)?.id ?? null;
  }, [starts, ends, matrixData]);

  // 길찾기 계산 완료 후 최적 경로 자동 선택
  useEffect(() => {
    if (!isCalculating && matrixData.length > 0) {
      const validResults = matrixData.filter((d) => !d.error && d.timeMn >= 0);
      if (validResults.length > 0) {
        const defaultResults = fairestEndId
          ? validResults.filter((d) => d.toId === fairestEndId)
          : validResults;
        const bestRoute = defaultResults.reduce((prev, curr) => (prev.timeMn < curr.timeMn ? prev : curr));

        setActiveMapRouteId(`${bestRoute.fromId}-${bestRoute.toId}`);
        setSelectedRoute(bestRoute);
      } else {
        setActiveMapRouteId(null);
        setSelectedRoute(null);
        setPolylinePath([]);
      }
    } else if (isCalculating) {
      setActiveMapRouteId(null);
      setSelectedRoute(null);
      setPolylinePath([]);
    }
  }, [isCalculating, matrixData, fairestEndId]);

  // 선택된 경로의 Graphic data 로드
  useEffect(() => {
    if (!selectedRoute) {
      setPolylinePath([]);
      return;
    }

    const fallbackPath = buildFallbackPath(selectedRoute, starts, ends);
    setPolylinePath(fallbackPath);

    if (!selectedRoute.mapObj) {
      return;
    }

    let isCancelled = false;

    const fetchGraphic = async () => {
      try {
        const res = await fetch(`/api/transit/graphic?mapObj=${selectedRoute.mapObj}`);
        if (!res.ok) throw new Error("그래픽 노선 조회 실패");
        const data: OdsayGraphicResponse = await res.json();
        const detailedPath = extractGraphicPath(data);

        if (!isCancelled && detailedPath.length >= 2) {
          setPolylinePath(detailedPath);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err);
        }
      }
    };

    fetchGraphic();

    return () => {
      isCancelled = true;
    };
  }, [selectedRoute, starts, ends]);

  const handleCalculateClick = () => {
    calculateMatrix(starts, ends, targetDate, targetTime);
  };

  const handleSelectRoute = (res: TransitFetchResult) => {
    setActiveMapRouteId(`${res.fromId}-${res.toId}`);
    setSelectedRoute(res);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* 1. 좌측 메인 컨텐츠 영역 (검색, 설정, 결과 테이블) */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="mb-10 text-center lg:text-left pt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              최적 경로 <span className="text-primary">비교기</span>
            </h1>
            <ShareButton />
          </div>
          <p className="text-foreground/70 text-lg md:text-xl">
            약속 장소 정하기 힘드신가요? 친구들 검색 한 번으로 다 해결하세요.
          </p>
        </header>

        {/* 출발 시간 설정 */}
        <TimeFilter />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* 출발지 입력 세션 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">🏠 출발지 ({starts.length})</h2>
            </div>
            <LocationInput placeholder="예: 강남역, 우리집" onSelect={addStart} />
            <ul className="flex flex-wrap gap-2 mt-2">
              {starts.map((start) => (
                <li
                  key={start.id}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-primary/20"
                >
                  {start.place_name}
                  <button
                    type="button"
                    onClick={() => removeStart(start.id)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                    aria-label="제거"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 목적지 입력 세션 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">🏁 목적지 후보 ({ends.length})</h2>
            </div>
            <LocationInput placeholder="예: 홍대입구, 여의도 한강공원" onSelect={addEnd} />
            <ul className="flex flex-wrap gap-2 mt-2">
              {ends.map((end) => (
                <li
                  key={end.id}
                  className="inline-flex items-center gap-1.5 bg-foreground/10 text-foreground px-3 py-1.5 rounded-full text-sm font-medium border border-border"
                >
                  {end.place_name}
                  <button
                    type="button"
                    onClick={() => removeEnd(end.id)}
                    className="hover:bg-foreground/20 rounded-full p-0.5"
                    aria-label="제거"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 실행 버튼 */}
        <div className="flex flex-col gap-4 mb-16">
          <button
            onClick={handleCalculateClick}
            disabled={isCalculating || starts.length === 0 || ends.length === 0}
            className="w-full py-4 bg-primary text-white text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transform transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-primary/30"
          >
            {isCalculating ? "경로 계산 중..." : "소요시간 비교하기 🚀"}
          </button>
          {error && <p className="text-red-500 font-medium text-center">{error}</p>}
        </div>

        {/* 결과 테이블 */}
        {(matrixData.length > 0 || isCalculating) && (
          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">📊 소요시간 비교 결과</h2>
            <ResultTable 
              starts={starts} 
              ends={ends} 
              matrixData={matrixData} 
              isCalculating={isCalculating}
              onSelectRoute={handleSelectRoute}
              activeMapRouteId={activeMapRouteId || undefined}
            />
          </section>
        )}
      </div>

      {/* 2. 우측 지도 영역 (PC에서는 고정, 모바일에서는 하단) */}
      <div className="w-full lg:w-[400px] xl:w-[500px] shrink-0">
        {/* top-8은 헤더/여백 고려한 스티키 위치 설정. calc(100vh - 4rem)으로 화면에 꽉차게 유지 */}
        <div className="sticky top-8 h-[400px] lg:h-[calc(100vh-4rem)] rounded-xl overflow-hidden shadow-lg border border-border">
          <MiniMap starts={starts} ends={ends} polylinePath={polylinePath} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8 mb-20">
      <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
        <RouteSync />
        <MainContent />
      </Suspense>
    </main>
  );
}
