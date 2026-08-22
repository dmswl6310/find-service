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
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="whitespace-nowrap text-sm font-semibold text-text">출발 시간 반영</span>
        <button
          type="button"
          onClick={() => setUseDepartureTime(!useDepartureTime)}
          className={`inline-flex min-h-11 w-full items-center justify-between rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 sm:w-[220px] ${
            useDepartureTime
              ? "border-action bg-canvas text-action"
              : "border-border bg-surface-raised text-text-muted"
          }`}
          aria-pressed={useDepartureTime}
        >
          <span>{useDepartureTime ? "켜짐" : "꺼짐"}</span>
          <span
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              useDepartureTime ? "bg-action" : "bg-border-strong"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-action-foreground transition-transform ${
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
            className="min-h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          />
          <input
            type="time"
            value={timeInputValue}
            onChange={handleTimeChange}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          />
          <button
            type="button"
            onClick={resetToNow}
            className="min-h-11 whitespace-nowrap rounded-xl border border-border-strong bg-surface px-4 text-sm text-text transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
          >
            현재 시간
          </button>
        </div>
      )}
    </div>
  );
}
