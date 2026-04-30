"use client";

import { useEffect, useRef, useState } from "react";
import { createTransitClientExceptionResult, parseTransitApiResult } from "@/lib/transitFetchAdapter";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

const TRANSIT_REQUEST_STAGGER_MS = 250;
const PARTIAL_FAILURE_MESSAGE = "일부 경로 계산에 실패했습니다. 콘솔을 확인하세요.";

async function fetchTransitCell(params: {
  start: KakaoLocation;
  end: KakaoLocation;
  targetDate?: string;
  targetTime?: string;
  signal?: AbortSignal;
}): Promise<TransitFetchResult> {
  const { start, end, targetDate, targetTime, signal } = params;
  const searchParams = new URLSearchParams({
    sx: start.x,
    sy: start.y,
    ex: end.x,
    ey: end.y,
  });

  if (targetDate && targetTime) {
    searchParams.set("date", targetDate);
    searchParams.set("time", targetTime);
  }

  try {
    const response = await fetch(`/api/transit?${searchParams.toString()}`, {
      signal,
    });
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
    if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
      return createTransitClientExceptionResult({
        fromId: start.id,
        toId: end.id,
        caughtError: new Error("요청이 취소되었습니다."),
      });
    }

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
  signal?: AbortSignal;
  timeoutIds: ReturnType<typeof setTimeout>[];
  cancelers: (() => void)[];
}): Promise<TransitFetchResult>[] {
  const { starts, ends, targetDate, targetTime, signal, timeoutIds, cancelers } = params;
  const requests: Promise<TransitFetchResult>[] = [];
  let delayMs = 0;

  starts.forEach((start) => {
    ends.forEach((end) => {
      requests.push(
        new Promise<TransitFetchResult>((resolve) => {
          let settled = false;
          const resolveCancelled = () => {
            if (settled) return;
            settled = true;
            resolve(createTransitClientExceptionResult({
              fromId: start.id,
              toId: end.id,
              caughtError: new Error("요청이 취소되었습니다."),
            }));
          };

          if (signal?.aborted) {
            resolveCancelled();
            return;
          }

          const timeoutId = setTimeout(() => {
            void fetchTransitCell({ start, end, targetDate, targetTime, signal }).then((result) => {
              if (settled) return;
              settled = true;
              resolve(result);
            });
          }, delayMs);

          timeoutIds.push(timeoutId);
          cancelers.push(() => {
            clearTimeout(timeoutId);
            resolveCancelled();
          });
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancelersRef = useRef<(() => void)[]>([]);

  const cancelPendingRequests = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
    cancelersRef.current.forEach((cancel) => cancel());
    cancelersRef.current = [];
  };

  useEffect(() => {
    return () => cancelPendingRequests();
  }, []);

  const resetMatrix = () => {
    calculationSeqRef.current += 1;
    cancelPendingRequests();
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
    cancelPendingRequests();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    timeoutIdsRef.current = [];
    cancelersRef.current = [];

    const fetchPromises = createStaggeredTransitRequests({
      starts,
      ends,
      targetDate,
      targetTime,
      signal: abortController.signal,
      timeoutIds: timeoutIdsRef.current,
      cancelers: cancelersRef.current,
    });

    try {
      // 병렬 요청으로 시간 단축 (최적화 포인트)
      const results = await Promise.all(fetchPromises);
      if (calculationSeq !== calculationSeqRef.current) {
        return;
      }

      abortControllerRef.current = null;
      timeoutIdsRef.current = [];
      cancelersRef.current = [];

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
