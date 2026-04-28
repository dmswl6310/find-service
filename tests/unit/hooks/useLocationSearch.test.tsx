import { renderHook, act } from "@testing-library/react";
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
});
