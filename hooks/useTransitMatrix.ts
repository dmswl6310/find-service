"use client";

import { useState } from "react";
import { KakaoLocation } from "@/types/kakao";
import { TransitFetchResult } from "@/types/odsay";

export function useTransitMatrix() {
  const [matrixData, setMatrixData] = useState<TransitFetchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateMatrix = async (starts: KakaoLocation[], ends: KakaoLocation[]) => {
    if (starts.length === 0 || ends.length === 0) {
      setError("출발지와 도착지를 각각 1개 이상 설정해주세요.");
      return;
    }

    setIsCalculating(true);
    setError(null);

    // NxM 개의 fetch Promise 배열 생성
    const fetchPromises: Promise<TransitFetchResult>[] = [];

    starts.forEach((start) => {
      ends.forEach((end) => {
        const promise = fetch(
          `/api/transit?sx=${start.x}&sy=${start.y}&ex=${end.x}&ey=${end.y}`
        )
          .then(async (res) => {
            if (!res.ok) {
              return {
                fromId: start.id,
                toId: end.id,
                timeMn: -1,
                payment: 0,
                pathType: 0,
                error: true,
              };
            }
            const data = await res.json();
            
            // 너무 가까워 도보로 판정된 경우 (에러코드 -98)
            if (data.walkOnly) {
               return {
                fromId: start.id,
                toId: end.id,
                timeMn: 0, // 도보 전용 식별용
                payment: 0,
                pathType: 0,
              };
            }

            return {
              fromId: start.id,
              toId: end.id,
              // API에서 totalTime을 받음
              timeMn: data.totalTime || -1,
              payment: data.payment || 0,
              pathType: data.pathType || 0,
            };
          })
          .catch(() => ({
            fromId: start.id,
            toId: end.id,
            timeMn: -1,
            payment: 0,
            pathType: 0,
            error: true,
          }));

        fetchPromises.push(promise);
      });
    });

    try {
      // 병렬 요청으로 시간 단축 (최적화 포인트)
      const results = await Promise.all(fetchPromises);
      setMatrixData(results);
    } catch (err) {
      setError("경로 계산 중 오류가 발생했습니다.");
    } finally {
      setIsCalculating(false);
    }
  };

  return { matrixData, isCalculating, calculateMatrix, error, setMatrixData };
}
