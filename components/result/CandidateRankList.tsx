import type { CandidateSummary } from "@/components/result/resultModel";
import { formatMinutesValue } from "@/components/result/formatMinutes";

type CandidateRankListProps = {
  summaries: CandidateSummary[];
  onSelectCandidate: (candidateId: string) => void;
};

export default function CandidateRankList({ summaries, onSelectCandidate }: CandidateRankListProps) {
  const orderedSummaries = [
    ...summaries.filter((summary) => summary.isComplete),
    ...summaries.filter((summary) => !summary.isComplete),
  ];
  const completeRanks = orderedSummaries.map((summary, index) =>
    summary.isComplete
      ? orderedSummaries.slice(0, index + 1).filter((item) => item.isComplete).length
      : null,
  );

  return (
    <section aria-labelledby="candidate-rank-heading">
      <h2 id="candidate-rank-heading" className="text-lg font-semibold text-text">후보 비교</h2>
      <ul className="mt-3 space-y-2">
        {orderedSummaries.map((summary, index) => (
          <li key={summary.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-text">
                  {summary.isComplete ? `${completeRanks[index]}위 · ` : ""}{summary.name}
                </p>
                {summary.isComplete ? (
                  <p className="mt-1 text-sm text-text-muted">
                    평균 {formatMinutesValue(summary.averageMinutes!)}분 · 최장 {summary.maxMinutes}분
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-warning">
                    비교 불가 · {summary.validRoutes}/{summary.totalRoutes} 경로 완료
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onSelectCandidate(summary.id)}
                className="shrink-0 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-text hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              >
                {summary.name} 선택
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
