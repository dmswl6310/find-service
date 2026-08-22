import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as appStoreModule from "@/store/useAppStore";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("scenario=input"),
}));

import DesignLabClient from "@/app/design-lab/DesignLabClient";

const initialStoreState = appStoreModule.useAppStore.getState();
const setLiveStoreState = appStoreModule.useAppStore.setState;

describe("Design Lab 시각 시나리오 결정성", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2042-01-03T22:45:00+09:00"));
    setLiveStoreState({
      starts: [],
      ends: [],
      useDepartureTime: false,
      targetDate: "20420103",
      targetTime: "2245",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    setLiveStoreState(initialStoreState, true);
    vi.restoreAllMocks();
  });

  it("스토어와 시스템 시간에 관계없이 승인된 입력 fixture를 표시한다", () => {
    const liveStoreHook = vi.spyOn(appStoreModule, "useAppStore");
    const view = render(<DesignLabClient />);

    expect(liveStoreHook).not.toHaveBeenCalled();
    expect(screen.getByLabelText("출발 날짜")).toHaveValue("2026-08-22");
    expect(screen.getByLabelText("출발 시간")).toHaveValue("09:30");
    expect(screen.getByRole("button", { name: "결과 공유 링크 복사" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "9개 경로 비교하기" })).toBeEnabled();

    setLiveStoreState({
      starts: [],
      ends: [],
      useDepartureTime: true,
      targetDate: "19991231",
      targetTime: "0001",
    });
    vi.setSystemTime(new Date("1999-12-31T00:01:00+09:00"));
    view.rerender(<DesignLabClient />);

    expect(liveStoreHook).not.toHaveBeenCalled();
    expect(screen.getByLabelText("출발 날짜")).toHaveValue("2026-08-22");
    expect(screen.getByLabelText("출발 시간")).toHaveValue("09:30");
    expect(screen.getByRole("button", { name: "결과 공유 링크 복사" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "9개 경로 비교하기" })).toBeEnabled();
  });
});
