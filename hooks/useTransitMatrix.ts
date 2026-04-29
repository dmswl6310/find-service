"use client";

import { useRef, useState } from "react";
import { createTransitClientExceptionResult, parseTransitApiResult } from "@/lib/transitFetchAdapter";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

const TRANSIT_REQUEST_STAGGER_MS = 250;
const PARTIAL_FAILURE_MESSAGE = "일부 경로 계산에 실패했습니다. 콘솔을 확인하세요.";

function buildTransitTimeParams(targetDate?: string, targetTime?: string) {
  return targetDate && targetTime ? `&date=${targetDate}&time=${targetTime}` : "";
}

async function fetchTransitCell(params: {
  start: KakaoLocation;
  end: KakaoLocation;
  targetDate?: string;
  targetTime?: string;
}): Promise<TransitFetchResult> {
  const { start, end, targetDate, targetTime } = params;
  const timeParams = buildTransitTimeParams(targetDate, targetTime);

  try {
    const response = await fetch(`/api/transit?sx=${start.x}&sy=${start.y}&ex=${end.x}&ey=${end.y}${timeParams}`);
    const data = await response.json().catch(() => null);
    const parsedResult = parseTransitApiResult({
      fromId: start.id,
      toId: end.id,
      response,
      data,
    });

    if (parsedResult.type === "http-error") {
      console.error("[transit] Route lookup failed", {
        fromId: start.id,
        toId: end.id,
        startName: start.place_name,
        endName: end.place_name,
        status: response.status,
        response: data,
      });

      return parsedResult.result;
    }

    if (parsedResult.type === "invalid-success-payload") {
      console.error("[transit] Route lookup returned invalid success payload", {
        fromId: start.id,
        toId: end.id,
        startName: start.place_name,
        endName: end.place_name,
        response: data,
      });

      return parsedResult.result;
    }

    return parsedResult.result;
  } catch (caughtError: unknown) {
    console.error("[transit] Transit request exception", {
      fromId: start.id,
      toId: end.id,
      startName: start.place_name,
      endName: end.place_name,
      error: caughtError,
    });

    return createTransitClientExceptionResult({
      fromId: start.id,
      toId: end.id,
      caughtError,
    });
  }
}

function createStaggeredTransitRequests(params: {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  targetDate?: string;
  targetTime?: string;
}): Promise<TransitFetchResult>[] {
  const { starts, ends, targetDate, targetTime } = params;
  const requests: Promise<TransitFetchResult>[] = [];
  let delayMs = 0;

  starts.forEach((start) => {
    ends.forEach((end) => {
      requests.push(
        new Promise<TransitFetchResult>((resolve) => {
          setTimeout(() => {
            void fetchTransitCell({ start, end, targetDate, targetTime }).then(resolve);
          }, delayMs);
        })
      );
      delayMs += TRANSIT_REQUEST_STAGGER_MS;
    });
  });

  return requests;
}

export function useTransitMatrix() {
  const [matrixData, setMatrixData] = useState<TransitFetchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calculationSeqRef = useRef(0);

  const resetMatrix = () => {
    calculationSeqRef.current += 1;
    setMatrixData([]);
    setError(null);
    setIsCalculating(false);
  };

  const calculateMatrix = async (
    starts: KakaoLocation[],
    ends: KakaoLocation[],
    targetDate?: string,
    targetTime?: string
  ) => {
    if (starts.length === 0 || ends.length === 0) {
      setError("출발지와 도착지를 각각 1개 이상 설정해주세요.");
      return;
    }

    setIsCalculating(true);
    setError(null);
    const calculationSeq = ++calculationSeqRef.current;

    const fetchPromises = createStaggeredTransitRequests({
      starts,
      ends,
      targetDate,
      targetTime,
    });

    try {
      // 병렬 요청으로 시간 단축 (최적화 포인트)
      const results = await Promise.all(fetchPromises);
      if (calculationSeq !== calculationSeqRef.current) {
        return;
      }

      setMatrixData(results);

      if (results.some((result) => result.error)) {
        setError(PARTIAL_FAILURE_MESSAGE);
      }
    } catch {
      if (calculationSeq === calculationSeqRef.current) {
        setError("경로 계산 중 오류가 발생했습니다.");
      }
    } finally {
      if (calculationSeq === calculationSeqRef.current) {
        setIsCalculating(false);
      }
    }
  };

  return { matrixData, isCalculating, calculateMatrix, error, resetMatrix, setMatrixData };
}
