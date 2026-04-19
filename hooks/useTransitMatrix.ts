"use client";

import { useState } from "react";
import { KakaoLocation } from "@/types/kakao";
import { TransitApiErrorPayload, TransitErrorSource, TransitFetchResult, OdsaySubPath } from "@/types/odsay";

interface TransitApiSuccessPayload {
  totalTime?: number;
  payment?: number;
  pathType?: number;
  transitCount?: number;
  subPath?: OdsaySubPath[];
  walkOnly?: boolean;
}

function isTransitApiErrorPayload(data: unknown): data is TransitApiErrorPayload {
  return typeof data === "object" && data !== null && "error" in data;
}

function isTransitApiSuccessPayload(data: unknown): data is TransitApiSuccessPayload {
  return typeof data === "object" && data !== null;
}

function createErrorResult(params: {
  fromId: string;
  toId: string;
  errorMessage: string;
  errorCode?: string;
  errorStatus?: number;
  errorSource?: TransitErrorSource;
  errorDetails?: string;
}): TransitFetchResult {
  return {
    fromId: params.fromId,
    toId: params.toId,
    timeMn: -1,
    payment: 0,
    pathType: 0,
    error: true,
    errorMessage: params.errorMessage,
    errorCode: params.errorCode,
    errorStatus: params.errorStatus,
    errorSource: params.errorSource,
    errorDetails: params.errorDetails,
  };
}

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
    let delayMs = 0; // API 호출 간격 누적 변수

    starts.forEach((start) => {
      ends.forEach((end) => {
        const promise = new Promise<TransitFetchResult>((resolve) => {
          setTimeout(() => {
            fetch(`/api/transit?sx=${start.x}&sy=${start.y}&ex=${end.x}&ey=${end.y}`)
              .then(async (res) => {
            const data = await res.json().catch(() => null);

            if (!res.ok) {
              const errorPayload = isTransitApiErrorPayload(data) ? data : null;

              console.error("[transit] Route lookup failed", {
                fromId: start.id,
                toId: end.id,
                startName: start.place_name,
                endName: end.place_name,
                status: res.status,
                response: data,
              });

              return createErrorResult({
                fromId: start.id,
                toId: end.id,
                errorMessage: errorPayload?.error || "조회 실패",
                errorCode: errorPayload?.errorCode,
                errorStatus: errorPayload?.errorStatus ?? res.status,
                errorSource: errorPayload?.errorSource,
                errorDetails: errorPayload?.errorDetails,
              });
            }

            if (!isTransitApiSuccessPayload(data)) {
              console.error("[transit] Route lookup returned invalid success payload", {
                fromId: start.id,
                toId: end.id,
                startName: start.place_name,
                endName: end.place_name,
                response: data,
              });

              return createErrorResult({
                fromId: start.id,
                toId: end.id,
                errorMessage: "응답 형식이 올바르지 않습니다.",
                errorSource: "route",
              });
            }
            
            // 너무 가까워 도보로 판정된 경우 (에러코드 -98)
            if (data.walkOnly) {
               return {
                fromId: start.id,
                toId: end.id,
                timeMn: 0, // 도보 전용 식별용
                payment: 0,
                pathType: 0,
                transitCount: 0,
                subPath: [],
              };
            }

            return {
                fromId: start.id,
                toId: end.id,
                // API에서 totalTime을 받음
                timeMn: data.totalTime || -1,
                payment: data.payment || 0,
                pathType: data.pathType || 0,
                transitCount: data.transitCount || 0,
                subPath: data.subPath || [],
              };
          })
          .catch((caughtError: unknown) => {
            console.error("[transit] Transit request exception", {
              fromId: start.id,
              toId: end.id,
              startName: start.place_name,
              endName: end.place_name,
              error: caughtError,
            });

            return createErrorResult({
              fromId: start.id,
              toId: end.id,
              errorMessage:
                caughtError instanceof Error
                  ? caughtError.message
                  : "경로 조회 중 요청 오류가 발생했습니다.",
              errorSource: "client",
            });
          })
          .then(resolve); // 최종 결과를 Promise resolve로 넘김
          }, delayMs);
        });

        fetchPromises.push(promise);
        delayMs += 250; // ODsay API 429 에러 방지를 위해 0.25초 간격으로 요청 지연 출발
      });
    });

    try {
      // 병렬 요청으로 시간 단축 (최적화 포인트)
      const results = await Promise.all(fetchPromises);
      setMatrixData(results);

      const hasFailedResult = results.some((result) => result.error);
      if (hasFailedResult) {
        setError("일부 경로 계산에 실패했습니다. 콘솔을 확인하세요.");
      }
    } catch {
      setError("경로 계산 중 오류가 발생했습니다.");
    } finally {
      setIsCalculating(false);
    }
  };

  return { matrixData, isCalculating, calculateMatrix, error, setMatrixData };
}
