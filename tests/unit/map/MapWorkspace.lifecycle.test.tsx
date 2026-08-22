import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dynamicHarness = vi.hoisted(() => ({
  mode: "delayed" as "delayed" | "mounted" | "error",
}));

vi.mock("next/dynamic", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  function MountedMap({ onMount }: { onMount?: () => void }) {
    React.useEffect(() => {
      onMount?.();
    }, [onMount]);

    return <div data-testid="mounted-live-map">실시간 지도 mount 완료</div>;
  }

  return {
    default: (
      _loader: () => Promise<unknown>,
      options: { loading?: () => React.ReactNode },
    ) => function ControlledDynamicMap(props: { onMount?: () => void }) {
      if (dynamicHarness.mode === "error") {
        throw new Error("chunk load failed");
      }

      if (dynamicHarness.mode === "delayed") {
        return options.loading?.() ?? null;
      }

      return <MountedMap {...props} />;
    },
  };
});

import MapWorkspace from "@/components/map/MapWorkspace";

const mapProps = { starts: [], ends: [] };

describe("MapWorkspace lazy 지도 수명주기", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dynamicHarness.mode = "delayed";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("dynamic chunk가 mount되지 않으면 작업공간 mount 8초 뒤 한국어 실패 UI를 표시한다", () => {
    render(<MapWorkspace {...mapProps} />);

    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("지도를 불러오지 못했습니다.");
    expect(screen.getByRole("status")).toHaveTextContent("네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.");
  });

  it("8초 실패 뒤 chunk가 늦게 준비되어도 실패 상태를 되돌리지 않는다", () => {
    const { rerender } = render(<MapWorkspace {...mapProps} />);

    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    dynamicHarness.mode = "mounted";
    rerender(<MapWorkspace {...mapProps} />);

    expect(screen.queryByTestId("mounted-live-map")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("지도를 불러오지 못했습니다.");
  });

  it("dynamic child가 정상 mount되면 outer timeout을 해제해 SDK 로딩 수명주기로 넘긴다", () => {
    dynamicHarness.mode = "mounted";
    render(<MapWorkspace {...mapProps} />);

    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(screen.getByTestId("mounted-live-map")).toBeVisible();
    expect(screen.queryByText("지도를 불러오지 못했습니다.")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("mount 대기 중 unmount하면 outer timeout을 정리한다", () => {
    const { unmount } = render(<MapWorkspace {...mapProps} />);

    expect(vi.getTimerCount()).toBe(1);
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("dynamic child render 오류를 경계에서 잡아 동일한 한국어 실패 UI로 바꾼다", () => {
    dynamicHarness.mode = "error";
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { unmount } = render(<MapWorkspace {...mapProps} />);
    expect(screen.getByRole("status")).toHaveTextContent("지도를 불러오지 못했습니다.");
    expect(screen.getByRole("status")).toHaveTextContent("네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.");
    expect(vi.getTimerCount()).toBe(0);

    unmount();
    dynamicHarness.mode = "mounted";
    render(<MapWorkspace {...mapProps} />);

    expect(screen.getByTestId("mounted-live-map")).toBeVisible();
  });
});
