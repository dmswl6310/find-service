"use client";

import { KakaoLocation } from "@/types/kakao";
import { TransitFetchResult } from "@/types/odsay";
import { formatTime } from "@/utils/formatTime";

interface ResultTableProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  matrixData: TransitFetchResult[];
  isCalculating: boolean;
}

export default function ResultTable({ starts, ends, matrixData, isCalculating }: ResultTableProps) {
  if (starts.length === 0 || ends.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-foreground/50 border-2 border-dashed border-border rounded-xl">
        출발지와 목적지를 추가하면 비교 결과가 나타납니다.
      </div>
    );
  }

  const getResult = (startId: string, endId: string) => {
    return matrixData.find((d) => d.fromId === startId && d.toId === endId);
  };

  return (
    <div className="w-full relative overflow-x-auto rounded-xl border border-border shadow-sm bg-surface">
      {/* 로딩 오버레이 */}
      {isCalculating && (
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm font-medium text-foreground">최적 경로 계산 중...</p>
        </div>
      )}

      <table className="w-full text-sm text-center border-collapse">
        <thead>
          <tr className="bg-primary/5 text-foreground border-b border-border">
            <th className="p-4 font-semibold w-32 border-r border-border">
              <span className="text-xs text-foreground/50 block mb-1">도착지 ➡️</span>
              <span className="text-xs text-foreground/50 block">⬇️ 출발지</span>
            </th>
            {ends.map((end) => (
              <th key={end.id} className="p-4 min-w-[120px] font-semibold border-r border-border last:border-0">
                {end.place_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {starts.map((start) => (
            <tr key={start.id} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors">
              <th className="p-4 font-medium text-foreground bg-surface border-r border-border text-left">
                {start.place_name}
              </th>
              {ends.map((end) => {
                const res = getResult(start.id, end.id);
                return (
                  <td key={`${start.id}-${end.id}`} className="p-4 border-r border-border last:border-0">
                    {res ? (
                      res.timeMn >= 0 ? (
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-lg font-bold text-primary">
                            {formatTime(res.timeMn)}
                          </span>
                          {res.payment > 0 && (
                            <span className="text-xs text-foreground/60">{res.payment.toLocaleString()}원</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs">조회 실패</span>
                      )
                    ) : (
                      <span className="text-foreground/30">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
