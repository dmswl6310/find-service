import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MiniMap from "@/components/map/MiniMap";
import type { KakaoLocation } from "@/types/kakao";

vi.mock("next/script", () => ({
  default: ({ onReady, onError }: { onReady: () => void; onError: () => void }) => (
    <span>
      <button type="button" onClick={onReady}>script-ready</button>
      <button type="button" onClick={onError}>script-error</button>
    </span>
  ),
}));

vi.mock("react-kakao-maps-sdk", () => ({
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="kakao-map">{children}</div>,
  MapMarker: ({ image, title, children }: { image: { src: string; size: { width: number; height: number } }; title: string; children?: React.ReactNode }) => (
    <div
      data-testid="map-marker"
      data-title={title}
      data-src={image.src}
      data-width={image.size.width}
      data-height={image.size.height}
    >
      {children}
    </div>
  ),
  Polyline: ({ strokeColor, strokeOpacity, strokeStyle, strokeWeight }: { strokeColor: string; strokeOpacity: number; strokeStyle: string; strokeWeight: number }) => (
    <div
      data-testid="map-polyline"
      data-color={strokeColor}
      data-opacity={strokeOpacity}
      data-style={strokeStyle}
      data-weight={strokeWeight}
    />
  ),
}));

const starts: KakaoLocation[] = [
  { id: "s1", place_name: "강남역", address_name: "서울", road_address_name: "서울", x: "127.0", y: "37.0" },
  { id: "s2", place_name: "홍대입구역", address_name: "서울", road_address_name: "서울", x: "126.9", y: "37.5" },
];

const ends: KakaoLocation[] = [
  { id: "e1", place_name: "을지로입구역", address_name: "서울", road_address_name: "서울", x: "126.98", y: "37.56" },
  { id: "e2", place_name: "성수역", address_name: "서울", road_address_name: "서울", x: "127.05", y: "37.54" },
];

describe("MiniMap", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_KAKAO_JS_API_KEY = "test-key";
    Object.defineProperty(window, "kakao", {
      configurable: true,
      value: { maps: { load: (callback: () => void) => callback() } },
    });
    document.documentElement.style.setProperty("--success", "#2f6b56");
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.removeProperty("--success");
  });

  it("선택된 출발지·후보지를 활성 크기로 표시하고 나머지 마커를 약화한다", async () => {
    render(<MiniMap starts={starts} ends={ends} selectedStartId="s1" selectedEndId="e2" />);
    fireEvent.click(screen.getByRole("button", { name: "script-ready" }));

    await waitFor(() => expect(screen.getByTestId("kakao-map")).toBeVisible());
    const markers = screen.getAllByTestId("map-marker");

    expect(markers.map((marker) => [marker.dataset.title, marker.dataset.width, marker.dataset.height])).toEqual([
      ["강남역", "40", "40"],
      ["홍대입구역", "32", "32"],
      ["을지로입구역", "34", "42"],
      ["성수역", "42", "50"],
    ]);
    expect(decodeURIComponent(markers[1].dataset.src ?? "")).toContain('opacity="0.48"');
    expect(screen.getByText("강남역")).toBeVisible();
    expect(screen.getByText("성수역")).toBeVisible();
  });

  it("경로 구간의 시맨틱 CSS 토큰을 Kakao 색상 값으로 해석한다", async () => {
    render(
      <MiniMap
        starts={starts.slice(0, 1)}
        ends={ends.slice(0, 1)}
        routeSegments={[{ kind: "bus", path: [{ lat: 37, lng: 127 }, { lat: 37.5, lng: 127.1 }] }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "script-ready" }));

    const route = await screen.findByTestId("map-polyline");
    expect(route).toHaveAttribute("data-color", "#2f6b56");
    expect(route).toHaveAttribute("data-opacity", "0.9");
    expect(route).toHaveAttribute("data-style", "solid");
    expect(route).toHaveAttribute("data-weight", "5");
  });

  it("SDK가 준비되지 않으면 8초 뒤 기존 한국어 실패 상태를 표시한다", () => {
    vi.useFakeTimers();
    render(<MiniMap starts={starts} ends={ends} />);

    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("지도를 불러오지 못했습니다.");
    expect(screen.getByRole("status")).toHaveTextContent("네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.");
  });
});
