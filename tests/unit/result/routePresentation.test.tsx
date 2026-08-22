import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DesignLabClient from "@/app/design-lab/DesignLabClient";
import RouteDetailSheet from "@/components/result/RouteDetailSheet";
import RouteMatrix from "@/components/result/RouteMatrix";
import { makeFailedRoute, makeLocation } from "@/tests/fixtures/transit";
import type { TransitFetchResult } from "@/types/odsay";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("scenario=foundation"),
}));

const starts = [makeLocation("s1", "홍대")];
const ends = [makeLocation("e1", "성수")];

const route: TransitFetchResult = {
  fromId: "s1",
  toId: "e1",
  timeMn: 38,
  payment: 1_500,
  pathType: 3,
  transitCount: 1,
  subPath: [
    { trafficType: 3, distance: 420, sectionTime: 6 },
    {
      trafficType: 1,
      distance: 4_800,
      sectionTime: 18,
      stationCount: 7,
      startName: "홍대입구역",
      endName: "뚝섬역",
      lane: [{ name: "지하철 2호선" }],
    },
    {
      trafficType: 2,
      distance: 1_200,
      sectionTime: 8,
      stationCount: 4,
      startName: "뚝섬역",
      endName: "성수역",
      lane: [{ busNo: "721" }],
    },
  ],
};

afterEach(() => {
  document.body.style.overflow = "";
});

describe("RouteMatrix 경로 동작", () => {
  it("성공 셀에서 지도 선택과 상세 열기를 분리하고 요약·요금·선택 상태를 표시한다", () => {
    const onSelectRoute = vi.fn();
    const onOpenRoute = vi.fn();

    render(
      <RouteMatrix
        starts={starts}
        ends={ends}
        matrixData={[route]}
        activeMapRouteId="s1-e1"
        onSelectRoute={onSelectRoute}
        onOpenRoute={onOpenRoute}
      />,
    );

    expect(screen.getByText("지하철 2호선 → 721번 버스")).toBeVisible();
    expect(screen.getByText("1,500원")).toBeVisible();

    const mapButton = screen.getByRole("button", { name: "홍대에서 성수까지 38분, 지도에서 보기" });
    expect(mapButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("선택됨")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "홍대에서 성수까지 상세 경로 보기" }));
    expect(onOpenRoute).toHaveBeenCalledWith(route, "홍대", "성수");
    expect(onSelectRoute).not.toHaveBeenCalled();

    fireEvent.click(mapButton);
    expect(onSelectRoute).toHaveBeenCalledWith(route);
    expect(onOpenRoute).toHaveBeenCalledTimes(1);
  });

  it("실패 셀은 지도 선택 없이 API 오류를 별도 상세 동작으로 열고 누락 셀은 명확히 표시한다", () => {
    const failedRoute = {
      ...makeFailedRoute("s1", "e1"),
      errorCode: "NO_ROUTE",
      errorStatus: 404,
      errorDetails: "ODsay에서 대중교통 경로를 찾지 못했습니다.",
    };
    const onSelectRoute = vi.fn();
    const onOpenRoute = vi.fn();

    render(
      <RouteMatrix
        starts={starts}
        ends={[...ends, makeLocation("e2", "광화문")]}
        matrixData={[failedRoute]}
        onSelectRoute={onSelectRoute}
        onOpenRoute={onOpenRoute}
      />,
    );

    expect(screen.getByText("경로 없음")).toBeVisible();
    expect(screen.getByText("경로 정보 없음")).toBeVisible();
    expect(screen.queryByRole("button", { name: /홍대에서 성수까지.*지도에서 보기/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "홍대에서 성수까지 실패 상세 보기" }));
    expect(onOpenRoute).toHaveBeenCalledWith(failedRoute, "홍대", "성수");
    expect(onSelectRoute).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /홍대에서 광화문까지.*상세/ })).not.toBeInTheDocument();
  });
});

describe("RouteDetailSheet 접근성", () => {
  it("이름과 설명이 있는 modal dialog 및 도보·지하철·버스 상세를 렌더링한다", () => {
    render(
      <RouteDetailSheet
        isOpen
        onClose={() => undefined}
        result={route}
        startName="홍대"
        endName="성수"
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "홍대에서 성수까지 상세 경로" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("총 38분, 환승 1회, 요금 1,500원");
    expect(screen.getByRole("button", { name: "상세 경로 닫기" })).toHaveFocus();
    expect(screen.getByText("도보", { selector: "span" })).toBeVisible();
    expect(screen.getByText("지하철", { selector: "span" })).toBeVisible();
    expect(screen.getByText("버스", { selector: "span" })).toBeVisible();
    expect(dialog).not.toHaveTextContent(/[🏃🚇🚌➡️✕]/u);
  });

  it("Escape로 닫고 Tab과 Shift+Tab 포커스를 다이얼로그 안에 가둔다", () => {
    const onClose = vi.fn();
    render(
      <RouteDetailSheet
        isOpen
        onClose={onClose}
        result={route}
        startName="홍대"
        endName="성수"
      />,
    );

    const closeButton = screen.getByRole("button", { name: "상세 경로 닫기" });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("열고 닫을 때 body 스크롤과 이전 포커스를 원래 상태로 복원한다", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button type="button">상세 열기</button>
        <RouteDetailSheet
          isOpen={false}
          onClose={onClose}
          result={route}
          startName="홍대"
          endName="성수"
        />
      </>,
    );
    const opener = screen.getByRole("button", { name: "상세 열기" });
    opener.focus();
    document.body.style.overflow = "clip";

    rerender(
      <>
        <button type="button">상세 열기</button>
        <RouteDetailSheet isOpen onClose={onClose} result={route} startName="홍대" endName="성수" />
      </>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "상세 경로 닫기" })).toHaveFocus();

    rerender(
      <>
        <button type="button">상세 열기</button>
        <RouteDetailSheet
          isOpen={false}
          onClose={onClose}
          result={route}
          startName="홍대"
          endName="성수"
        />
      </>,
    );
    expect(document.body.style.overflow).toBe("clip");
    expect(screen.getByRole("button", { name: "상세 열기" })).toHaveFocus();
  });

  it("열린 상태로 unmount되어도 body 스크롤과 외부 포커스를 복원한다", () => {
    const opener = document.createElement("button");
    opener.textContent = "외부 열기";
    document.body.append(opener);
    opener.focus();
    document.body.style.overflow = "scroll";

    const { unmount } = render(
      <RouteDetailSheet
        isOpen
        onClose={() => undefined}
        result={route}
        startName="홍대"
        endName="성수"
      />,
    );
    unmount();

    expect(document.body.style.overflow).toBe("scroll");
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("다이얼로그 내부 클릭은 유지하고 backdrop 클릭만 닫는다", () => {
    const onClose = vi.fn();
    render(
      <RouteDetailSheet
        isOpen
        onClose={onClose}
        result={route}
        startName="홍대"
        endName="성수"
      />,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = dialog.parentElement?.firstElementChild;
    expect(backdrop).toBeInstanceOf(HTMLElement);
    fireEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("실패 결과의 API 메시지와 진단 정보를 안전하게 표시한다", () => {
    const failedRoute = {
      ...makeFailedRoute("s1", "e1"),
      errorCode: "NO_ROUTE",
      errorStatus: 404,
      errorDetails: "ODsay에서 대중교통 경로를 찾지 못했습니다.",
    };

    render(
      <RouteDetailSheet
        isOpen
        onClose={() => undefined}
        result={failedRoute}
        startName="홍대"
        endName="성수"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("경로 없음");
    expect(screen.getByRole("alert")).toHaveTextContent("NO_ROUTE");
    expect(screen.getByRole("alert")).toHaveTextContent("404");
    expect(screen.getByRole("alert")).toHaveTextContent("ODsay에서 대중교통 경로를 찾지 못했습니다.");
    expect(screen.getByRole("dialog")).not.toHaveTextContent("-1분");
  });
});

describe("Design Lab 고정 경로 예시", () => {
  it("외부 API 없이 실제 매트릭스에서 도보·지하철·버스 상세 시트를 연다", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<DesignLabClient />);

    expect(screen.getByRole("heading", { name: "경로 매트릭스와 상세 시트" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "강남역에서 을지로입구역까지 상세 경로 보기" }));

    const dialog = screen.getByRole("dialog", { name: "강남역에서 을지로입구역까지 상세 경로" });
    expect(dialog).toHaveTextContent("도보");
    expect(dialog).toHaveTextContent("지하철");
    expect(dialog).toHaveTextContent("버스");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
