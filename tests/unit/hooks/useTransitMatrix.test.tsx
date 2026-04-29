import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTransitMatrix } from "@/hooks/useTransitMatrix";
import type { KakaoLocation } from "@/types/kakao";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
}

describe("useTransitMatrix", () => {
  const starts: KakaoLocation[] = [
    {
      id: "s1",
      place_name: "출발지",
      address_name: "",
      road_address_name: "",
      x: "126.1",
      y: "37.1",
    },
  ];

  const ends: KakaoLocation[] = [
    {
      id: "e1",
      place_name: "도착지1",
      address_name: "",
      road_address_name: "",
      x: "126.2",
      y: "37.2",
    },
    {
      id: "e2",
      place_name: "도착지2",
      address_name: "",
      road_address_name: "",
      x: "126.3",
      y: "37.3",
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("keeps successful cells while surfacing page-level partial failure warning", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("ex=126.2")) {
        return Promise.resolve(
          jsonResponse({
            totalTime: 18,
            payment: 1400,
            pathType: 3,
            transitCount: 1,
            subPath: [],
            mapObj: "m1",
          })
        );
      }

      return Promise.resolve(
        jsonResponse(
          {
            error: "경로 없음",
            errorCode: "4",
            errorStatus: 404,
            errorSource: "odsay",
          },
          404
        )
      );
    });

    const { result } = renderHook(() => useTransitMatrix());

    await act(async () => {
      const promise = result.current.calculateMatrix(starts, ends, "20260427", "0930");
      await vi.advanceTimersByTimeAsync(1_000);
      await promise;
    });

    expect(result.current.matrixData).toHaveLength(2);

    const success = result.current.matrixData.find((item: { toId: string }) => item.toId === "e1");
    const failure = result.current.matrixData.find((item: { toId: string }) => item.toId === "e2");

    expect(success).toMatchObject({
      fromId: "s1",
      toId: "e1",
      timeMn: 18,
    });
    expect(failure).toMatchObject({
      fromId: "s1",
      toId: "e2",
      timeMn: -1,
      error: true,
      errorStatus: 404,
    });
    expect(result.current.error).toBe("일부 경로 계산에 실패했습니다. 콘솔을 확인하세요.");
  });

  it("passes selected departure date and time to transit requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        totalTime: 18,
        payment: 1400,
        pathType: 3,
        transitCount: 1,
        subPath: [],
        mapObj: "m1",
      })
    );

    const { result } = renderHook(() => useTransitMatrix());

    await act(async () => {
      const promise = result.current.calculateMatrix([starts[0]], [ends[0]], "20260429", "1830");
      await vi.advanceTimersByTimeAsync(300);
      await promise;
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/transit?sx=126.1&sy=37.1&ex=126.2&ey=37.2&date=20260429&time=1830"
    );
  });

  it("resets previous matrix data and warning when locations are edited", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("ex=126.2")) {
        return Promise.resolve(
          jsonResponse({
            totalTime: 18,
            payment: 1400,
            pathType: 3,
            transitCount: 1,
            subPath: [],
            mapObj: "m1",
          })
        );
      }

      return Promise.resolve(
        jsonResponse(
          {
            error: "경로 없음",
            errorCode: "4",
            errorStatus: 404,
            errorSource: "odsay",
          },
          404
        )
      );
    });

    const { result } = renderHook(() => useTransitMatrix());

    await act(async () => {
      const promise = result.current.calculateMatrix(starts, ends);
      await vi.advanceTimersByTimeAsync(1_000);
      await promise;
    });

    expect(result.current.matrixData).toHaveLength(2);
    expect(result.current.error).toBe("일부 경로 계산에 실패했습니다. 콘솔을 확인하세요.");

    act(() => {
      result.current.resetMatrix();
    });

    expect(result.current.matrixData).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isCalculating).toBe(false);
  });

  it("ignores stale calculation results after reset", async () => {
    const pendingTransit = deferred<Response>();

    vi.spyOn(globalThis, "fetch").mockReturnValue(pendingTransit.promise);

    const { result } = renderHook(() => useTransitMatrix());

    let calculatePromise!: Promise<void>;
    act(() => {
      calculatePromise = result.current.calculateMatrix([starts[0]], [ends[0]]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    act(() => {
      result.current.resetMatrix();
    });

    await act(async () => {
      pendingTransit.resolve(
        jsonResponse({
          totalTime: 18,
          payment: 1400,
          pathType: 3,
          transitCount: 1,
          subPath: [],
          mapObj: "m1",
        })
      );
      await calculatePromise;
    });

    expect(result.current.matrixData).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isCalculating).toBe(false);
  });
});
