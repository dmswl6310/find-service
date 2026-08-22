export default function MapFailureState() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-center aspect-square md:aspect-auto"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-text">지도를 불러오지 못했습니다.</p>
      <p className="text-xs leading-5 text-text-muted">네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.</p>
    </div>
  );
}
