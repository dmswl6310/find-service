"use client";

import { useAppStore } from "@/store/useAppStore";

export default function TimeFilter() {
  const {
    useDepartureTime,
    targetDate,
    targetTime,
    setUseDepartureTime,
    setTargetDate,
    setTargetTime,
  } = useAppStore();

  const dateInputValue = targetDate
    ? `${targetDate.slice(0, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6, 8)}`
    : "";
  const timeInputValue = targetTime
    ? `${targetTime.slice(0, 2)}:${targetTime.slice(2, 4)}`
    : "";

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      setTargetDate(val.replace(/-/g, ""));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // HH:mm
    if (val) {
      setTargetTime(val.replace(":", ""));
    }
  };

  const resetToNow = () => {
    const now = new Date();
    const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const t = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    setTargetDate(d);
    setTargetTime(t);
  };

  return (
    <div className="flex flex-col gap-3 bg-surface border border-border p-4 rounded-2xl shadow-sm mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold whitespace-nowrap">⏳ 출발 시간 반영</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              선택 사항
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground/60">
            켜면 특정 날짜와 시간 기준으로, 끄면 시간 조건 없이 비교해요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUseDepartureTime(!useDepartureTime)}
          className={`inline-flex h-10 w-full items-center justify-between rounded-xl border px-4 text-sm font-medium transition-colors sm:w-[220px] ${
            useDepartureTime
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-background text-foreground/70"
          }`}
          aria-pressed={useDepartureTime}
        >
          <span>{useDepartureTime ? "시간 조건 사용 중" : "시간 조건 사용 안 함"}</span>
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              useDepartureTime ? "bg-primary" : "bg-foreground/20"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                useDepartureTime ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </div>

      {useDepartureTime && (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
          <input
            type="date"
            value={dateInputValue}
            onChange={handleDateChange}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus-ring"
          />
          <input
            type="time"
            value={timeInputValue}
            onChange={handleTimeChange}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus-ring"
          />
          <button
            type="button"
            onClick={resetToNow}
            className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm hover:bg-secondary/80 whitespace-nowrap transition-colors"
          >
            현재 시간
          </button>
        </div>
      )}
    </div>
  );
}
