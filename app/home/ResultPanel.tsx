"use client";

import BalanceSummary from "@/components/result/BalanceSummary";
import CalculationProgress from "@/components/result/CalculationProgress";
import CandidateRankList from "@/components/result/CandidateRankList";
import PartialFailureNotice from "@/components/result/PartialFailureNotice";
import type { CandidateSummary } from "@/components/result/resultModel";
import Button from "@/components/ui/Button";
import InlineNotice from "@/components/ui/InlineNotice";
import type { CalculationProgress as CalculationProgressState } from "@/hooks/useTransitMatrix";
import type { TransitFetchResult } from "@/types/odsay";

export type ResultPanelProps = {
  summaries: CandidateSummary[];
  matrixData: TransitFetchResult[];
  calculationProgress: CalculationProgressState;
  isCalculating: boolean;
  error: string | null;
  onEditInputs: () => void;
  onRetry: () => void;
  onSelectCandidate: (candidateId: string) => void;
  onOpenMatrix: () => void;
};

export default function ResultPanel({
  summaries,
  matrixData,
  calculationProgress,
  isCalculating,
  onEditInputs,
  onRetry,
  onSelectCandidate,
  onOpenMatrix,
}: ResultPanelProps) {
  const failedCount = matrixData.filter((result) => result.error || result.timeMn < 0).length;
  const isTotalFailure = matrixData.length > 0 && failedCount === matrixData.length;
  const completeSummaries = summaries.filter((summary) => summary.isComplete);
  const balanceSummary = completeSummaries.find((summary) => summary.isFairest);

  if (isCalculating) {
    return <CalculationProgress completed={calculationProgress.completed} total={calculationProgress.total} />;
  }

  if (isTotalFailure) {
    return (
      <section className="space-y-4" aria-label="경로 계산 실패">
        <InlineNotice tone="danger" title="모든 경로 계산에 실패했습니다.">
          장소 입력은 유지됩니다. 잠시 후 다시 계산하거나 장소를 수정해 주세요.
        </InlineNotice>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onRetry}>다시 계산하기</Button>
          <Button type="button" variant="secondary" onClick={onEditInputs}>장소 수정하기</Button>
          <Button type="button" variant="secondary" onClick={onOpenMatrix}>실패 상세 보기</Button>
        </div>
      </section>
    );
  }

  if (matrixData.length === 0) {
    return (
      <InlineNotice tone="info" title="결과를 기다리고 있습니다.">
        아직 계산한 결과가 없습니다. 장소를 추가하고 경로를 비교해 주세요.
      </InlineNotice>
    );
  }

  const hasNoEligibleBalance = completeSummaries.length === 0;

  return (
    <section className="space-y-5" aria-label="후보 비교 결과">
      {failedCount > 0 && <PartialFailureNotice failedCount={failedCount} totalCount={matrixData.length} />}
      {hasNoEligibleBalance ? (
        <InlineNotice tone="warning" title="완전 비교 후보가 없습니다.">
          성공한 경로와 비교가 끝나지 않은 후보를 표시합니다. 모든 출발지의 경로가 완료된 후보가 있어야 황금 밸런스를 선정할 수 있습니다.
        </InlineNotice>
      ) : balanceSummary ? (
        <BalanceSummary
          name={balanceSummary.name}
          averageMinutes={balanceSummary.averageMinutes!}
          maxMinutes={balanceSummary.maxMinutes!}
        />
      ) : null}
      <CandidateRankList summaries={summaries} onSelectCandidate={onSelectCandidate} />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onOpenMatrix}>경로표 열기</Button>
        <Button type="button" variant="ghost" onClick={onEditInputs}>장소 수정하기</Button>
      </div>
    </section>
  );
}
