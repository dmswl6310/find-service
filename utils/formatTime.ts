export function formatTime(minutes: number): string {
  if (minutes < 0) return "조회 불가";
  if (minutes === 0) return "도보 이동";
  
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) {
    return `${h}시간 ${m > 0 ? `${m}분` : ""}`;
  }
  return `${m}분`;
}
