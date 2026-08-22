import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BalanceSummary from "@/components/result/BalanceSummary";
import CalculationProgress from "@/components/result/CalculationProgress";
import CandidateRankList from "@/components/result/CandidateRankList";
import PartialFailureNotice from "@/components/result/PartialFailureNotice";
import ResultPanel from "@/app/home/ResultPanel";
import type { CandidateSummary } from "@/components/result/resultModel";
import { makeFailedRoute, makeRoute } from "@/tests/fixtures/transit";

const completeCandidate: CandidateSummary = {
  id: "e1",
  name: "을지로3가",
  averageMinutes: 43,
  maxMinutes: 58,
  score: 101,
  isComplete: true,
  isFairest: true,
  validRoutes: 2,
  totalRoutes: 2,
  originalIndex: 0,
};

const incompleteCandidate: CandidateSummary = {
  id: "e2",
  name: "성수역",
  averageMinutes: null,
  maxMinutes: null,
  score: null,
  isComplete: false,
  isFairest: false,
  validRoutes: 1,
  totalRoutes: 2,
  originalIndex: 1,
};

const secondCompleteCandidate: CandidateSummary = {
  ...completeCandidate,
  id: "e3",
  name: "광화문역",
  averageMinutes: 50,
  maxMinutes: 65,
  score: 115,
  isFairest: false,
  originalIndex: 0,
};

const baseProps = {
  summaries: [] as CandidateSummary[],
  matrixData: [],
  calculationProgress: { completed: 0, total: 0 },
  isCalculating: false,
  error: null,
  onEditInputs: vi.fn(),
  onRetry: vi.fn(),
  onSelectCandidate: vi.fn(),
  onOpenMatrix: vi.fn(),
};

describe("결과 요약 컴포넌트", () => {
  it("왕관 없이 평균·최장 시간을 표시한다", () => {
    render(<BalanceSummary name="을지로3가" averageMinutes={43} maxMinutes={58} />);

    expect(screen.getByText("황금 밸런스")).toBeVisible();
    expect(screen.getByText("43분")).toBeVisible();
    expect(screen.getByText("58분")).toBeVisible();
    expect(screen.queryByText(/👑/)).not.toBeInTheDocument();
  });

  it("완료 수와 부분 실패의 유지 결과를 알린다", () => {
    render(
      <>
        <CalculationProgress completed={6} total={9} currentCandidate="성수역" />
        <PartialFailureNotice failedCount={1} totalCount={9} />
      </>,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6");
    expect(screen.getByRole("alert")).toHaveTextContent("성공한 8개 경로는 그대로 표시합니다");
  });

  it("계산 전에는 빈 결과 상태를 표시한다", () => {
    render(<ResultPanel {...baseProps} />);

    expect(screen.getByRole("status")).toHaveTextContent("아직 계산한 결과가 없습니다");
  });

  it("계산 중에는 진행률을 표시한다", () => {
    render(<ResultPanel {...baseProps} isCalculating calculationProgress={{ completed: 2, total: 4 }} />);

    expect(screen.getByRole("progressbar", { name: "경로 계산 진행률" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("경로를 계산하고 있습니다.")).toBeVisible();
  });

  it("완전한 성공 결과를 황금 밸런스와 순위로 표시하고 CTA를 연결한다", () => {
    const onSelectCandidate = vi.fn();
    const onOpenMatrix = vi.fn();
    render(
      <ResultPanel
        {...baseProps}
        summaries={[completeCandidate]}
        matrixData={[makeRoute("s1", "e1", 40), makeRoute("s2", "e1", 46)]}
        calculationProgress={{ completed: 2, total: 2 }}
        onSelectCandidate={onSelectCandidate}
        onOpenMatrix={onOpenMatrix}
      />,
    );

    expect(screen.getByText("황금 밸런스")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "을지로3가 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "경로표 열기" }));
    expect(onSelectCandidate).toHaveBeenCalledWith("e1");
    expect(onOpenMatrix).toHaveBeenCalledTimes(1);
  });

  it("부분 실패에서는 완전 후보를 우선하고 불완전 후보와 성공 결과를 유지한다", () => {
    render(
      <ResultPanel
        {...baseProps}
        summaries={[incompleteCandidate, completeCandidate]}
        matrixData={[
          makeRoute("s1", "e1", 40),
          makeRoute("s2", "e1", 46),
          makeRoute("s1", "e2", 30),
          makeFailedRoute("s2", "e2"),
        ]}
        calculationProgress={{ completed: 4, total: 4 }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("성공한 3개 경로는 그대로 표시합니다");
    expect(screen.getByText("비교 불가 · 1/2 경로 완료")).toBeVisible();
    expect(screen.getByText("황금 밸런스")).toBeVisible();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(
      expect.arrayContaining(["을지로3가 선택", "성수역 선택"]),
    );
  });

  it("뷰 모델이 정한 완전 후보 순위는 유지하면서 불완전 후보만 뒤로 보낸다", () => {
    render(
      <CandidateRankList
        summaries={[{ ...completeCandidate, originalIndex: 1 }, incompleteCandidate, secondCompleteCandidate]}
        onSelectCandidate={() => undefined}
      />,
    );

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "을지로3가 선택",
      "광화문역 선택",
      "성수역 선택",
    ]);
  });

  it("성공 경로가 있어도 완전 후보가 없으면 황금 밸런스를 선정하지 않는다", () => {
    render(
      <ResultPanel
        {...baseProps}
        summaries={[incompleteCandidate]}
        matrixData={[makeRoute("s1", "e2", 30), makeFailedRoute("s2", "e2")]}
        calculationProgress={{ completed: 2, total: 2 }}
        error="모든 경로 계산에 실패했습니다."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("완전 비교 후보가 없습니다");
    expect(screen.getByText("비교 불가 · 1/2 경로 완료")).toBeVisible();
    expect(screen.queryByText("황금 밸런스")).not.toBeInTheDocument();
    expect(screen.queryByText("모든 경로 계산에 실패했습니다.")).not.toBeInTheDocument();
  });

  it("모든 매트릭스 경로가 실패한 경우에만 재시도와 장소 수정 CTA를 표시한다", () => {
    const onRetry = vi.fn();
    const onEditInputs = vi.fn();
    render(
      <ResultPanel
        {...baseProps}
        matrixData={[makeFailedRoute("s1", "e1"), makeFailedRoute("s2", "e1")]}
        calculationProgress={{ completed: 2, total: 2 }}
        error="다른 오류 문구"
        onRetry={onRetry}
        onEditInputs={onEditInputs}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("모든 경로 계산에 실패했습니다");
    fireEvent.click(screen.getByRole("button", { name: "다시 계산하기" }));
    fireEvent.click(screen.getByRole("button", { name: "장소 수정하기" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onEditInputs).toHaveBeenCalledTimes(1);
  });
});
