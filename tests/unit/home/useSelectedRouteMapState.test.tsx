import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSelectedRouteMapState } from "@/app/home/useSelectedRouteMapState";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

const starts: KakaoLocation[] = [
  {
    id: "s1",
    place_name: "출발지",
    address_name: "서울",
    road_address_name: "서울",
    x: "127.0",
    y: "37.0",
  },
];

const ends: KakaoLocation[] = [
  {
    id: "e1",
    place_name: "도착지1",
    address_name: "서울",
    road_address_name: "서울",
    x: "127.1",
    y: "37.1",
  },
  {
    id: "e2",
    place_name: "도착지2",
    address_name: "서울",
    road_address_name: "서울",
    x: "127.2",
    y: "37.2",
  },
];

const routeToE1: TransitFetchResult = {
  fromId: "s1",
  toId: "e1",
  timeMn: 22,
  payment: 1400,
  pathType: 3,
  transitCount: 1,
  mapObj: "route-e1",
  subPath: [{ trafficType: 3, distance: 120, sectionTime: 4, startX: "127.0", startY: "37.0", endX: "127.1", endY: "37.1" }],
};

const routeToE2: TransitFetchResult = {
  fromId: "s1",
  toId: "e2",
  timeMn: 11,
  payment: 1400,
  pathType: 3,
  transitCount: 1,
  mapObj: "route-e2",
  subPath: [{ trafficType: 3, distance: 150, sectionTime: 5, startX: "127.0", startY: "37.0", endX: "127.2", endY: "37.2" }],
};

const updatedRouteToE1: TransitFetchResult = {
  ...routeToE1,
  timeMn: 18,
  mapObj: "route-e1-updated",
  subPath: [
    {
      trafficType: 3,
      distance: 180,
      sectionTime: 6,
      startX: "128.0",
      startY: "38.0",
      endX: "128.4",
      endY: "38.4",
    },
  ],
};

const matrixData = [routeToE1, routeToE2];

describe("useSelectedRouteMapState", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("syncs selected route to active map route id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          result: {
            lane: [{ section: [{ graphPos: [{ x: "127.0", y: "37.0" }, { x: "127.2", y: "37.2" }] }] }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { result } = renderHook(() =>
      useSelectedRouteMapState({
        starts,
        ends,
        matrixData,
        isCalculating: false,
      })
    );

    await waitFor(() => {
      expect(result.current.activeMapRouteId).toBe("s1-e2");
    });

    act(() => {
      result.current.handleSelectRoute(routeToE1);
    });

    await waitFor(() => {
      expect(result.current.activeMapRouteId).toBe("s1-e1");
      expect(result.current.selectedRoute?.toId).toBe("e1");
    });
  });

  it("keeps fallback segments when graphic API returns 502", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "bad mapObj", errorCode: "-1" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() =>
      useSelectedRouteMapState({
        starts,
        ends,
        matrixData: [routeToE1],
        isCalculating: false,
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.routeSegments.length).toBeGreaterThan(0);
    });

    expect(result.current.detailedPath).toEqual([]);
  });

  it("marks the first route-selection commit as old geometry ownership before publishing new coordinates", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "fallback" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const commits: Array<{
      selectedRouteId: string | null;
      geometryRouteId: string | null;
      lastPoint: { lat: number; lng: number } | null;
    }> = [];

    function Harness() {
      const state = useSelectedRouteMapState({
        starts,
        ends,
        matrixData,
        isCalculating: false,
      });
      const lastSegment = state.routeSegments.at(-1);
      const lastPoint = lastSegment?.path.at(-1) ?? null;

      useLayoutEffect(() => {
        commits.push({
          selectedRouteId: state.selectedRoute
            ? `${state.selectedRoute.fromId}-${state.selectedRoute.toId}`
            : null,
          geometryRouteId: state.geometryRouteId,
          lastPoint,
        });
      });

      return (
        <button type="button" onClick={() => state.handleSelectRoute(routeToE1)}>
          첫 경로 선택
        </button>
      );
    }

    render(<Harness />);
    await waitFor(() => {
      expect(commits.at(-1)).toEqual({
        selectedRouteId: "s1-e2",
        geometryRouteId: "s1-e2",
        lastPoint: { lat: 37.2, lng: 127.2 },
      });
    });
    commits.length = 0;

    fireEvent.click(screen.getByRole("button", { name: "첫 경로 선택" }));

    await waitFor(() => {
      expect(commits.at(-1)).toEqual({
        selectedRouteId: "s1-e1",
        geometryRouteId: "s1-e1",
        lastPoint: { lat: 37.1, lng: 127.1 },
      });
    });
    expect(commits[0]).toEqual({
      selectedRouteId: "s1-e1",
      geometryRouteId: "s1-e2",
      lastPoint: { lat: 37.2, lng: 127.2 },
    });
  });

  it("distinguishes a new route object from old geometry when both routes have the same ids", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "fallback" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const commits: Array<{
      selectedRoute: TransitFetchResult | null;
      geometryRoute: TransitFetchResult | null;
      lastPoint: { lat: number; lng: number } | null;
    }> = [];

    function Harness({ route }: { route: TransitFetchResult }) {
      const state = useSelectedRouteMapState({
        starts,
        ends,
        matrixData: [route],
        isCalculating: false,
      });

      useLayoutEffect(() => {
        commits.push({
          selectedRoute: state.selectedRoute,
          geometryRoute: state.geometryRoute,
          lastPoint: state.routeSegments.at(-1)?.path.at(-1) ?? null,
        });
      });

      return null;
    }

    const view = render(<Harness route={routeToE1} />);
    await waitFor(() => {
      expect(commits.at(-1)?.selectedRoute).toBe(routeToE1);
      expect(commits.at(-1)?.geometryRoute).toBe(routeToE1);
      expect(commits.at(-1)?.lastPoint).toEqual({ lat: 37.1, lng: 127.1 });
    });
    commits.length = 0;

    view.rerender(<Harness route={updatedRouteToE1} />);
    await waitFor(() => {
      expect(commits.at(-1)?.selectedRoute).toBe(updatedRouteToE1);
      expect(commits.at(-1)?.geometryRoute).toBe(updatedRouteToE1);
      expect(commits.at(-1)?.lastPoint).toEqual({ lat: 38.4, lng: 128.4 });
    });

    const firstUpdatedSelection = commits.find(
      (commit) => commit.selectedRoute === updatedRouteToE1,
    );
    expect(firstUpdatedSelection?.geometryRoute).toBe(routeToE1);
    expect(firstUpdatedSelection?.lastPoint).toEqual({ lat: 37.1, lng: 127.1 });
    expect(commits.at(-1)?.geometryRoute).not.toBe(routeToE1);
    expect(commits.at(-1)?.lastPoint).not.toEqual({ lat: 37.1, lng: 127.1 });
  });

  it("aborts an old graphic request and never assigns its coordinates to the new geometry owner", async () => {
    type PendingGraphic = {
      signal: AbortSignal;
      resolve: (response: Response) => void;
    };
    const pending = new Map<string, PendingGraphic>();
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      return new Promise<Response>((resolve) => {
        pending.set(url, { signal: init?.signal as AbortSignal, resolve });
      });
    });

    const { result } = renderHook(() =>
      useSelectedRouteMapState({ starts, ends, matrixData, isCalculating: false }),
    );
    await waitFor(() => {
      expect(pending.has("/api/transit/graphic?mapObj=route-e2")).toBe(true);
      expect(result.current.geometryRouteId).toBe("s1-e2");
    });

    act(() => result.current.handleSelectRoute(routeToE1));
    await waitFor(() => {
      expect(pending.has("/api/transit/graphic?mapObj=route-e1")).toBe(true);
      expect(result.current.geometryRouteId).toBe("s1-e1");
    });
    expect(pending.get("/api/transit/graphic?mapObj=route-e2")?.signal.aborted).toBe(true);

    await act(async () => {
      pending.get("/api/transit/graphic?mapObj=route-e1")?.resolve(
        new Response(
          JSON.stringify({
            result: {
              lane: [
                {
                  section: [
                    { graphPos: [{ x: "127.01", y: "37.01" }, { x: "127.11", y: "37.11" }] },
                  ],
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });
    await waitFor(() => {
      expect(result.current.detailedPath.at(-1)).toEqual({ lat: 37.11, lng: 127.11 });
    });

    await act(async () => {
      pending.get("/api/transit/graphic?mapObj=route-e2")?.resolve(
        new Response(
          JSON.stringify({
            result: {
              lane: [
                {
                  section: [
                    { graphPos: [{ x: "129.0", y: "39.0" }, { x: "129.1", y: "39.1" }] },
                  ],
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    expect(result.current.geometryRouteId).toBe("s1-e1");
    expect(result.current.detailedPath.at(-1)).toEqual({ lat: 37.11, lng: 127.11 });
    expect(result.current.detailedPath).not.toContainEqual({ lat: 39.1, lng: 129.1 });
  });

  it("rejects a late same-id graphic response by exact route owner even if abort cannot cancel it", async () => {
    const NativeAbortController = globalThis.AbortController;
    class NonAbortingController {
      readonly signal = new NativeAbortController().signal;
      abort() {}
    }
    vi.stubGlobal("AbortController", NonAbortingController);

    const pending = new Map<string, (response: Response) => void>();
    vi.spyOn(globalThis, "fetch").mockImplementation((input) =>
      new Promise<Response>((resolve) => {
        pending.set(String(input), resolve);
      }),
    );
    const { result, rerender } = renderHook(
      ({ route }: { route: TransitFetchResult }) =>
        useSelectedRouteMapState({ starts, ends, matrixData: [route], isCalculating: false }),
      { initialProps: { route: routeToE1 } },
    );
    await waitFor(() => {
      expect(result.current.geometryRoute).toBe(routeToE1);
      expect(pending.has("/api/transit/graphic?mapObj=route-e1")).toBe(true);
    });

    rerender({ route: updatedRouteToE1 });
    await waitFor(() => {
      expect(result.current.geometryRoute).toBe(updatedRouteToE1);
      expect(pending.has("/api/transit/graphic?mapObj=route-e1-updated")).toBe(true);
    });

    await act(async () => {
      pending.get("/api/transit/graphic?mapObj=route-e1-updated")?.(
        new Response(
          JSON.stringify({
            result: {
              lane: [
                {
                  section: [
                    { graphPos: [{ x: "128.0", y: "38.0" }, { x: "128.8", y: "38.8" }] },
                  ],
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });
    await waitFor(() => {
      expect(result.current.detailedPath.at(-1)).toEqual({ lat: 38.8, lng: 128.8 });
    });

    await act(async () => {
      pending.get("/api/transit/graphic?mapObj=route-e1")?.(
        new Response(
          JSON.stringify({
            result: {
              lane: [
                {
                  section: [
                    { graphPos: [{ x: "129.0", y: "39.0" }, { x: "129.9", y: "39.9" }] },
                  ],
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    expect(result.current.geometryRoute).toBe(updatedRouteToE1);
    expect(result.current.geometryRouteId).toBe("s1-e1");
    expect(result.current.detailedPath.at(-1)).toEqual({ lat: 38.8, lng: 128.8 });
    expect(result.current.detailedPath).not.toContainEqual({ lat: 39.9, lng: 129.9 });
  });

  it("clears geometry ownership with route state while calculating or empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "fallback" }), { status: 502 }),
    );
    const { result, rerender } = renderHook(
      ({ nextMatrix, isCalculating }: { nextMatrix: TransitFetchResult[]; isCalculating: boolean }) =>
        useSelectedRouteMapState({ starts, ends, matrixData: nextMatrix, isCalculating }),
      { initialProps: { nextMatrix: matrixData, isCalculating: false } },
    );
    await waitFor(() => expect(result.current.geometryRouteId).toBe("s1-e2"));

    rerender({ nextMatrix: matrixData, isCalculating: true });
    await waitFor(() => {
      expect(result.current.selectedRoute).toBeNull();
      expect(result.current.geometryRoute).toBeNull();
      expect(result.current.geometryRouteId).toBeNull();
      expect(result.current.routeSegments).toEqual([]);
      expect(result.current.detailedPath).toEqual([]);
    });

    rerender({ nextMatrix: [], isCalculating: false });
    await waitFor(() => {
      expect(result.current.geometryRoute).toBeNull();
      expect(result.current.geometryRouteId).toBeNull();
    });
  });
});
