import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocationSearch } from "@/hooks/useLocationSearch";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function searchResponse(placeName: string) {
  return new Response(
    JSON.stringify({
      meta: { total_count: 1, pageable_count: 1, is_end: true },
      documents: [
        {
          id: placeName,
          place_name: placeName,
          address_name: "서울",
          road_address_name: "서울",
          x: "127",
          y: "37",
        },
      ],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

describe("useLocationSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("ignores stale search responses and keeps newest results", async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();

    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("q=old")) {
        return first.promise;
      }

      return second.promise;
    });

    const { result } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.setQuery("old");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    act(() => {
      result.current.setQuery("new");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await act(async () => {
      second.resolve(searchResponse("new-result"));
      await Promise.resolve();
    });

    expect(result.current.results[0]?.place_name).toBe("new-result");

    await act(async () => {
      first.resolve(searchResponse("old-result"));
      await Promise.resolve();
    });

    expect(result.current.results[0]?.place_name).toBe("new-result");
  });

  it("surfaces search API failures to the input UI", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "카카오 API 연동 중 오류가 발생했습니다." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useLocationSearch());

    act(() => {
      result.current.setQuery("강남");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      await Promise.resolve();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.error).toBe("카카오 API 연동 중 오류가 발생했습니다.");
  });

  it("새 query는 진행 중인 이전 요청을 즉시 무효화하고 새 검색은 계속한다", async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();

    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) =>
      String(input).includes("q=old") ? first.promise : second.promise,
    );

    const { result } = renderHook(() => useLocationSearch());
    act(() => {
      result.current.setQuery("old");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    act(() => {
      result.current.setQuery("new");
    });
    expect(result.current.query).toBe("new");
    expect(result.current.results).toEqual([]);
    expect(result.current.isOpen).toBe(false);

    await act(async () => {
      first.resolve(searchResponse("old-result"));
      await Promise.resolve();
    });
    expect(result.current.results).toEqual([]);
    expect(result.current.isOpen).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      second.resolve(searchResponse("new-result"));
      await Promise.resolve();
    });
    expect(result.current.results[0]?.place_name).toBe("new-result");
  });

  it("완료한 query로 debounce 전에 돌아오면 같은 query를 다시 검색한다", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(searchResponse("first-result"))
      .mockResolvedValueOnce(searchResponse("refetched-result"));

    const { result } = renderHook(() => useLocationSearch());
    act(() => {
      result.current.setQuery("same");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.results[0]?.place_name).toBe("first-result");

    act(() => {
      result.current.setQuery("different");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    act(() => {
      result.current.setQuery("same");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.results[0]?.place_name).toBe("refetched-result");
  });

  it("지연된 실패 JSON은 새 query의 오류 상태를 덮어쓰지 않는다", async () => {
    const failedJson = deferred<{ error: string }>();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: () => failedJson.promise,
    } as Response);

    const { result } = renderHook(() => useLocationSearch());
    act(() => {
      result.current.setQuery("old");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    act(() => {
      result.current.setQuery("new");
    });
    await act(async () => {
      failedJson.resolve({ error: "이전 검색 오류" });
      await Promise.resolve();
    });

    expect(result.current.query).toBe("new");
    expect(result.current.results).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
