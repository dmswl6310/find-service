import { useEffect, useMemo, useState } from "react";
import { KakaoLocation } from "@/types/kakao";
import { OdsayGraphicResponse, TransitFetchResult } from "@/types/odsay";
import { buildRouteSegments, extractGraphicPath, MapPathPoint, MapRouteSegment } from "./mapRouteHelpers";

type Params = {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  matrixData: TransitFetchResult[];
  isCalculating: boolean;
};

export function useSelectedRouteMapState({ starts, ends, matrixData, isCalculating }: Params) {
  const [activeMapRouteId, setActiveMapRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransitFetchResult | null>(null);
  const [routeSegments, setRouteSegments] = useState<MapRouteSegment[]>([]);
  const [detailedPath, setDetailedPath] = useState<MapPathPoint[]>([]);

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

    const validScores = scores.filter((score) => score.score !== Infinity);
    if (validScores.length === 0) return null;

    const minScore = Math.min(...validScores.map((score) => score.score));
    return validScores.find((score) => score.score === minScore)?.id ?? null;
  }, [starts, ends, matrixData]);

  useEffect(() => {
    if (!isCalculating && matrixData.length > 0) {
      const validResults = matrixData.filter((result) => !result.error && result.timeMn >= 0);
      if (validResults.length > 0) {
        const defaultResults = fairestEndId ? validResults.filter((result) => result.toId === fairestEndId) : validResults;
        const bestRoute = defaultResults.reduce((previous, current) =>
          previous.timeMn < current.timeMn ? previous : current
        );

        setActiveMapRouteId(`${bestRoute.fromId}-${bestRoute.toId}`);
        setSelectedRoute(bestRoute);
      } else {
        setActiveMapRouteId(null);
        setSelectedRoute(null);
        setRouteSegments([]);
        setDetailedPath([]);
      }
    } else if (isCalculating) {
      setActiveMapRouteId(null);
      setSelectedRoute(null);
      setRouteSegments([]);
      setDetailedPath([]);
    }
  }, [isCalculating, matrixData, fairestEndId]);

  useEffect(() => {
    if (!selectedRoute) {
      setRouteSegments([]);
      setDetailedPath([]);
      return;
    }

    const fallbackSegments = buildRouteSegments(selectedRoute, starts, ends);
    setRouteSegments(fallbackSegments);
    setDetailedPath([]);

    if (!selectedRoute.mapObj) {
      return;
    }

    let isCancelled = false;

    const fetchGraphic = async () => {
      try {
        const res = await fetch(`/api/transit/graphic?mapObj=${selectedRoute.mapObj}`);
        if (res.status === 502) {
          return;
        }

        if (!res.ok) throw new Error("그래픽 노선 조회 실패");

        const data: OdsayGraphicResponse = await res.json();
        const nextDetailedPath = extractGraphicPath(data);

        if (!isCancelled && nextDetailedPath.length >= 2) {
          setDetailedPath(nextDetailedPath);
        }
      } catch (err) {
        if (!isCancelled && process.env.NODE_ENV === "development") {
          console.warn("그래픽 노선 상세 좌표를 불러오지 못해 대체 경로선을 유지합니다.", err);
        }
      }
    };

    void fetchGraphic();

    return () => {
      isCancelled = true;
    };
  }, [selectedRoute, starts, ends]);

  const handleSelectRoute = (route: TransitFetchResult) => {
    setActiveMapRouteId(`${route.fromId}-${route.toId}`);
    setSelectedRoute(route);
  };

  return {
    activeMapRouteId,
    selectedRoute,
    routeSegments,
    detailedPath,
    handleSelectRoute,
  };
}
