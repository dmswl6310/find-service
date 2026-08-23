"use client";

import { useEffect, useRef, useState } from "react";
import { createTransitClientExceptionResult, parseTransitApiResult } from "@/lib/transitFetchAdapter";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

const TRANSIT_MAX_CONCURRENCY = 3;
const TRANSIT_MIN_START_GAP_MS = 500;
const PARTIAL_FAILURE_MESSAGE = "일부 경로 계산에 실패했습니다. 콘솔을 확인하세요.";

export type CalculationProgress = {
  completed: number;
  total: number;
  currentCandidate?: string;
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

function isTransitRateLimitResult(result: TransitFetchResult): boolean {
  return result.errorStatus === 429 || result.errorCode === "-1";
}

function abortableDelay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (milliseconds <= 0) return Promise.resolve();
  if (signal?.aborted) {
    return Promise.reject(new DOMException("요청이 취소되었습니다.", "AbortError"));
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, milliseconds);

    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("요청이 취소되었습니다.", "AbortError"));
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

type ScheduledTransitCell = {
  end: KakaoLocation;
  promise: Promise<TransitFetchResult>;
  resolve: (result: TransitFetchResult) => void;
  start: KakaoLocation;
  status: "queued" | "started" | "settled";
};

function createScheduledTransitRequests(params: {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  targetDate?: string;
  targetTime?: string;
  signal?: AbortSignal;
  cancelers: (() => void)[];
}): Promise<TransitFetchResult>[] {
  const { starts, ends, targetDate, targetTime, signal, cancelers } = params;
  const cells = starts.flatMap((start) => ends.map((end) => ({ start, end })));
  const scheduledCells: ScheduledTransitCell[] = cells.map(({ start, end }) => {
    let resolve!: (result: TransitFetchResult) => void;
    const promise = new Promise<TransitFetchResult>((promiseResolve) => {
      resolve = promiseResolve;
    });

    return {
      end,
      promise,
      resolve,
      start,
      status: "queued",
    };
  });

  const settleCell = (
    cell: ScheduledTransitCell,
    result: TransitFetchResult
  ) => {
    if (cell.status === "settled") return;
    cell.status = "settled";
    cell.resolve(result);
  };

  const cancellationResult = (
    cell: ScheduledTransitCell,
    message = "요청이 취소되었습니다."
  ) =>
    createTransitClientExceptionResult({
      fromId: cell.start.id,
      toId: cell.end.id,
      caughtError: new Error(message),
    });

  scheduledCells.forEach((cell) => {
    cancelers.push(() => settleCell(cell, cancellationResult(cell)));
  });

  let nextCellIndex = 0;
  let nextAllowedStartAt = 0;
  let stopAdmission = false;
  let startGate = Promise.resolve();

  const reserveStartSlot = () => {
    const reservation = startGate.then(async () => {
      const delayMs = Math.max(0, nextAllowedStartAt - Date.now());
      await abortableDelay(delayMs, signal);
      if (signal?.aborted) {
        throw new DOMException("요청이 취소되었습니다.", "AbortError");
      }
      nextAllowedStartAt = Date.now() + TRANSIT_MIN_START_GAP_MS;
    });
    startGate = reservation.catch(() => undefined);
    return reservation;
  };

  const stopQueuedRequests = () => {
    stopAdmission = true;
    scheduledCells.forEach((cell) => {
      if (cell.status !== "queued") return;
      settleCell(
        cell,
        cancellationResult(
          cell,
          "요청 제한이 감지되어 남은 경로 계산을 중단했습니다."
        )
      );
    });
  };

  const runWorker = async () => {
    while (!signal?.aborted && !stopAdmission) {
      const cellIndex = nextCellIndex;
      nextCellIndex += 1;
      const cell = scheduledCells[cellIndex];
      if (!cell) return;

      try {
        await reserveStartSlot();
      } catch {
        settleCell(cell, cancellationResult(cell));
        continue;
      }

      if (
        cell.status === "settled" ||
        stopAdmission ||
        signal?.aborted
      ) {
        settleCell(cell, cancellationResult(cell));
        continue;
      }

      cell.status = "started";
      const result = await fetchTransitCell({
        start: cell.start,
        end: cell.end,
        targetDate,
        targetTime,
        signal,
      });
      settleCell(cell, result);

      if (isTransitRateLimitResult(result)) {
        stopQueuedRequests();
      }
    }
  };

  const workerCount = Math.min(TRANSIT_MAX_CONCURRENCY, scheduledCells.length);
  for (let workerIndex = 0; workerIndex < workerCount; workerIndex += 1) {
    void runWorker();
  }

  return scheduledCells.map((cell) => cell.promise);
}

export function useTransitMatrix() {
  const [matrixData, setMatrixData] = useState<TransitFetchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationProgress, setCalculationProgress] = useState<CalculationProgress>({ completed: 0, total: 0 });
  const calculationSeqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelersRef = useRef<(() => void)[]>([]);

  const cancelPendingRequests = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
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
    cancelersRef.current = [];

    const fetchPromises = createScheduledTransitRequests({
      starts,
      ends,
      targetDate,
      targetTime,
      signal: abortController.signal,
      cancelers: cancelersRef.current,
    });
    const settledResults: Array<TransitFetchResult | undefined> = new Array(
      fetchPromises.length,
    );

    try {
      const results = await Promise.all(
        fetchPromises.map((promise, cellIndex) =>
          promise.then((result) => {
            if (calculationSeq === calculationSeqRef.current) {
              settledResults[cellIndex] = result;
              setMatrixData(
                settledResults.filter(
                  (settledResult): settledResult is TransitFetchResult =>
                    settledResult !== undefined,
                ),
              );
              setCalculationProgress((current) => ({
                completed: Math.min(current.completed + 1, current.total),
                total: current.total,
                currentCandidate:
                  ends.find((end) => end.id === result.toId)?.place_name ??
                  current.currentCandidate,
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
      cancelersRef.current = [];

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
