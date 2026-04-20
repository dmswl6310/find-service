"use client";

import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";

export default function TimeFilter() {
  const { targetDate, targetTime, setTargetDate, setTargetTime } = useAppStore();
  
  // input date type은 YYYY-MM-DD
  // 내부 store는 YYYYMMDD
  const [dateInputValue, setDateInputValue] = useState("");
  // input time type은 HH:mm
  // 내부 store는 HHMM
  const [timeInputValue, setTimeInputValue] = useState("");

  useEffect(() => {
    if (targetDate) {
      setDateInputValue(`${targetDate.slice(0, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6, 8)}`);
    }
  }, [targetDate]);

  useEffect(() => {
    if (targetTime) {
      setTimeInputValue(`${targetTime.slice(0, 2)}:${targetTime.slice(2, 4)}`);
    }
  }, [targetTime]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    setDateInputValue(val);
    if (val) {
      setTargetDate(val.replace(/-/g, ""));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // HH:mm
    setTimeInputValue(val);
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
    <div className="flex flex-col sm:flex-row items-center gap-2 bg-surface border border-border p-3 rounded-xl shadow-sm mb-4">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm font-medium w-max whitespace-nowrap">⏳ 출발 시간</span>
        <input
          type="date"
          value={dateInputValue}
          onChange={handleDateChange}
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus-ring"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          type="time"
          value={timeInputValue}
          onChange={handleTimeChange}
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus-ring"
        />
        <button
          onClick={resetToNow}
          className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80 whitespace-nowrap transition-colors"
        >
          현재 시간
        </button>
      </div>
    </div>
  );
}
