"use client";

import { useEffect, useRef, useState } from "react";
import { createTransitClientExceptionResult, parseTransitApiResult } from "@/lib/transitFetchAdapter";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

const TRANSIT_REQUEST_STAGGER_MS = 250;
const PARTIAL_FAILURE_MESSAGE = "일부 경로 계산에 실패했습니다. 콘솔을 확인하세요.";

export type CalculationProgress = {
  completed: number;
  total: number;
};

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
  let currentChain = Promise.resolve();

  starts.forEach((start) => {
    ends.forEach((end) => {
      let isSettled = false;
      let resolvePromise: (value: TransitFetchResult) => void;

      const promise = new Promise<TransitFetchResult>((resolve) => {
        resolvePromise = resolve;
      });

      requests.push(promise);

      const resolveCancelled = () => {
        if (isSettled) return;
        isSettled = true;
        resolvePromise(
          createTransitClientExceptionResult({
            fromId: start.id,
            toId: end.id,
            caughtError: new Error("요청이 취소되었습니다."),
          })
        );
      };

      cancelers.push(resolveCancelled);

      currentChain = currentChain.then(async () => {
        if (isSettled || signal?.aborted) {
          if (!isSettled) resolveCancelled();
          return;
        }

        const result = await fetchTransitCell({ start, end, targetDate, targetTime, signal });
        
        if (!isSettled) {
          isSettled = true;
          resolvePromise(result);
        }

        // ODsay API 동시성 에러(컴포넌트 에러 -1)를 방지하기 위해 다음 요청 전 대기
        await new Promise<void>((res) => {
          const timeoutId = setTimeout(res, TRANSIT_REQUEST_STAGGER_MS);
          timeoutIds.push(timeoutId);
        });
      });
    });
  });

  return requests;
}

export function useTransitMatrix() {
  const [matrixData, setMatrixData] = useState<TransitFetchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationProgress, setCalculationProgress] = useState<CalculationProgress>({ completed: 0, total: 0 });
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
    setCalculationProgress({ completed: 0, total: 0 });
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
    setMatrixData([]);
    setCalculationProgress({ completed: 0, total: starts.length * ends.length });
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
      const results = await Promise.all(
        fetchPromises.map((promise) =>
          promise.then((result) => {
            if (calculationSeq === calculationSeqRef.current) {
              setCalculationProgress((current) => ({
                completed: Math.min(current.completed + 1, current.total),
                total: current.total,
              }));
            }

            return result;
          })
        )
      );
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

  return { matrixData, isCalculating, calculateMatrix, error, resetMatrix, setMatrixData, calculationProgress };
}
