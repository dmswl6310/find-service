import Progress from "@/components/ui/Progress";

type CalculationProgressProps = {
  completed: number;
  total: number;
  currentCandidate?: string;
};

export default function CalculationProgress({ completed, total, currentCandidate }: CalculationProgressProps) {
  return (
    <section className="border border-border bg-surface p-4" aria-live="polite" aria-label="경로 계산 상태">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="font-medium text-text">경로를 계산하고 있습니다.</p>
        <p className="text-text-muted">{completed} / {total}</p>
      </div>
      <Progress className="mt-3" value={completed} max={total} label="경로 계산 진행률" />
      {currentCandidate && <p className="mt-3 text-sm text-text-muted">현재 후보: {currentCandidate}</p>}
    </section>
  );
}
