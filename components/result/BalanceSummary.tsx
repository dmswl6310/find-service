type BalanceSummaryProps = {
  name: string;
  averageMinutes: number;
  maxMinutes: number;
};

export default function BalanceSummary({ name, averageMinutes, maxMinutes }: BalanceSummaryProps) {
  return (
    <section className="border-l-[3px] border-balance bg-balance-soft p-5" aria-labelledby="balance-summary-heading">
      <p className="text-sm font-semibold text-balance">황금 밸런스</p>
      <h2 id="balance-summary-heading" className="mt-1 text-xl font-semibold text-text">{name}</h2>
      <p className="mt-2 text-sm text-text-muted">평균과 최장 이동시간의 합이 가장 낮습니다.</p>
      <dl className="mt-4 grid grid-cols-2 divide-x divide-border">
        <div className="pr-4">
          <dt className="text-sm text-text-muted">평균 이동시간</dt>
          <dd className="mt-1 text-lg font-semibold text-text">{averageMinutes}분</dd>
        </div>
        <div className="pl-4">
          <dt className="text-sm text-text-muted">최장 이동시간</dt>
          <dd className="mt-1 text-lg font-semibold text-text">{maxMinutes}분</dd>
        </div>
      </dl>
    </section>
  );
}
