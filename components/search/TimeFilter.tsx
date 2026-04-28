"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  fromDateInputValue,
  fromTimeInputValue,
  getCurrentDateTime,
  toDateInputValue,
  toTimeInputValue,
} from "@/utils/dateTime";

export default function TimeFilter() {
  const {
    useDepartureTime,
    targetDate,
    targetTime,
    setUseDepartureTime,
    setTargetDate,
    setTargetTime,
  } = useAppStore();

  const dateInputValue = toDateInputValue(targetDate);
  const timeInputValue = toTimeInputValue(targetTime);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      setTargetDate(fromDateInputValue(val));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // HH:mm
    if (val) {
      setTargetTime(fromTimeInputValue(val));
    }
  };

  const resetToNow = () => {
    const now = getCurrentDateTime();
    setTargetDate(now.date);
    setTargetTime(now.time);
  };

  return (
    <div className="flex flex-col gap-3 bg-surface border border-border p-4 rounded-2xl shadow-sm mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold whitespace-nowrap">⏳ 출발 시간 반영</span>
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
          <span>{useDepartureTime ? "켜짐" : "꺼짐"}</span>
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
