import { act, renderHook, waitFor } from "@testing-library/react";
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

const matrixData = [routeToE1, routeToE2];

describe("useSelectedRouteMapState", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
});
