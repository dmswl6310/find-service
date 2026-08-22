import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MapWorkspace from "@/components/map/MapWorkspace";
import StaticMapSurface from "@/components/map/StaticMapSurface";
import type { CandidateSummary } from "@/components/result/resultModel";

const selectedCandidate: CandidateSummary = {
  id: "candidate-1",
  name: "을지로입구역",
  averageMinutes: 35,
  maxMinutes: 41,
  score: 76,
  isComplete: true,
  isFairest: true,
  validRoutes: 3,
  totalRoutes: 3,
  originalIndex: 0,
};

describe("지도 표면", () => {
  it("정적 표면은 숫자 출발지·문자 후보지·선택 경로를 접근 가능한 고정 지도로 표시한다", () => {
    render(<StaticMapSurface />);

    expect(screen.getByRole("img", { name: "출발지 3곳과 후보지 3곳, 선택 경로가 표시된 고정 지도 미리보기" })).toBeVisible();
    expect(screen.getByLabelText("출발지 1")).toHaveTextContent("1");
    expect(screen.getByLabelText("후보지 A")).toHaveTextContent("A");
    expect(screen.getByLabelText("선택 경로")).toBeVisible();
  });

  it("실시간 작업공간은 형태·텍스트 범례를 제공하고 결과가 있을 때만 선택 요약을 겹쳐 표시한다", () => {
    const mapProps = { starts: [], ends: [] };
    const { rerender } = render(<MapWorkspace {...mapProps} />);

    expect(screen.getByText("숫자 원형 · 출발지")).toBeVisible();
    expect(screen.getByText("문자 사각 핀 · 후보지")).toBeVisible();
    expect(screen.queryByLabelText("선택 후보 요약")).not.toBeInTheDocument();

    rerender(
      <MapWorkspace
        {...mapProps}
        selectedCandidate={selectedCandidate}
        selectedRouteName="강남역 → 을지로입구역"
      />,
    );

    expect(screen.getByLabelText("선택 후보 요약")).toHaveTextContent("을지로입구역");
    expect(screen.getByLabelText("선택 후보 요약")).toHaveTextContent("평균 35분");
    expect(screen.getByLabelText("선택 후보 요약")).toHaveTextContent("강남역 → 을지로입구역");
  });
});
