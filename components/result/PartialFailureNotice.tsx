type PartialFailureNoticeProps = {
  failedCount: number;
  totalCount: number;
};

export default function PartialFailureNotice({ failedCount, totalCount }: PartialFailureNoticeProps) {
  const successfulCount = Math.max(totalCount - failedCount, 0);

  return (
    <div role="alert" className="border-l-4 border-l-warning border-y border-r border-border bg-surface p-4">
      <p className="font-medium text-warning">일부 경로를 완료하지 못했습니다.</p>
      <p className="mt-1 text-sm text-text">
        {failedCount}개 경로를 완료하지 못했습니다. 성공한 {successfulCount}개 경로는 그대로 표시합니다.
      </p>
    </div>
  );
}
