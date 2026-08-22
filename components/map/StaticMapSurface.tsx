const ORIGIN_MARKERS = [
  { label: "1", position: "left-[12%] top-[20%]" },
  { label: "2", position: "left-[16%] top-[68%]" },
  { label: "3", position: "left-[42%] top-[12%]" },
] as const;

const CANDIDATE_MARKERS = [
  { label: "A", position: "right-[16%] top-[18%]" },
  { label: "B", position: "right-[10%] top-[58%]" },
  { label: "C", position: "right-[34%] top-[70%]" },
] as const;

export default function StaticMapSurface() {
  return (
    <div
      role="img"
      aria-label="출발지 3곳과 후보지 3곳, 선택 경로가 표시된 고정 지도 미리보기"
      className="relative min-h-80 w-full overflow-hidden rounded-xl border border-border bg-surface-raised"
    >
      <div className="absolute inset-x-[-8%] top-[24%] h-5 rotate-[-8deg] border-y border-border bg-surface" />
      <div className="absolute inset-x-[-8%] top-[62%] h-4 rotate-[7deg] border-y border-border bg-surface" />
      <div className="absolute inset-y-[-10%] left-[32%] w-5 rotate-[10deg] border-x border-border bg-surface" />
      <div className="absolute inset-y-[-10%] right-[28%] w-4 rotate-[-12deg] border-x border-border bg-surface" />

      <div
        aria-label="선택 경로"
        className="absolute left-[20%] top-[48%] h-1.5 w-[58%] origin-left rotate-[-16deg] rounded-full bg-origin shadow-sm"
      />
      <div className="absolute left-[47%] top-[39%] h-1.5 w-[31%] origin-left rotate-[31deg] rounded-full bg-success shadow-sm" />

      {ORIGIN_MARKERS.map((marker) => (
        <span
          key={marker.label}
          aria-label={`출발지 ${marker.label}`}
          className={`absolute ${marker.position} flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-origin text-xs font-bold text-action-foreground shadow-sm`}
        >
          {marker.label}
        </span>
      ))}
      {CANDIDATE_MARKERS.map((marker) => (
        <span
          key={marker.label}
          aria-label={`후보지 ${marker.label}`}
          className={`absolute ${marker.position} flex h-9 w-9 items-center justify-center rounded-lg border-2 border-surface bg-candidate text-xs font-bold text-action-foreground shadow-sm after:absolute after:-bottom-1 after:h-2 after:w-2 after:rotate-45 after:bg-candidate`}
        >
          <span className="relative z-10">{marker.label}</span>
        </span>
      ))}
    </div>
  );
}
