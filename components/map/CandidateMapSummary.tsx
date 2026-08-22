import type { CandidateSummary } from "@/components/result/resultModel";

export interface CandidateMapSummaryProps {
  candidate: CandidateSummary;
  routeName?: string;
}

export default function CandidateMapSummary({
  candidate,
  routeName,
}: CandidateMapSummaryProps) {
  return (
    <aside
      aria-label="선택 후보 요약"
      className="absolute inset-x-3 top-3 z-10 rounded-xl border border-border-strong bg-surface/95 p-3 shadow-lg backdrop-blur-sm md:top-auto md:bottom-3 md:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-candidate">선택 후보</p>
          <p className="mt-1 font-semibold text-text">{candidate.name}</p>
          {routeName ? <p className="mt-1 text-xs text-text-muted">{routeName}</p> : null}
        </div>
        {candidate.isComplete ? (
          <p className="text-sm font-medium text-text">
            평균 {candidate.averageMinutes}분 · 최장 {candidate.maxMinutes}분
          </p>
        ) : (
          <p className="text-sm font-medium text-warning">
            비교 불가 · {candidate.validRoutes}/{candidate.totalRoutes} 경로 완료
          </p>
        )}
      </div>
    </aside>
  );
}
