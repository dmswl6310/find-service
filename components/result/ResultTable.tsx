"use client";

import { KakaoLocation } from "@/types/kakao";
import { TransitFetchResult, OdsaySubPath } from "@/types/odsay";
import { formatTime } from "@/utils/formatTime";
import { useState } from "react";
import RouteDetailModal from "./RouteDetailModal";

interface ResultTableProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  matrixData: TransitFetchResult[];
  isCalculating: boolean;
}

export default function ResultTable({ starts, ends, matrixData, isCalculating }: ResultTableProps) {
  const [selectedResult, setSelectedResult] = useState<{ res: TransitFetchResult, startName: string, endName: string } | null>(null);

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

  const getErrorTitle = (res: TransitFetchResult) => {
    const parts = [res.errorMessage, res.errorCode ? `코드: ${res.errorCode}` : null, res.errorStatus ? `상태: ${res.errorStatus}` : null];
    return parts.filter(Boolean).join(" | ");
  };

  const getShortSummary = (subPaths?: OdsaySubPath[]) => {
    if (!subPaths || subPaths.length === 0) return null;
    const transitNames = subPaths
      .filter((p) => p.trafficType === 1 || p.trafficType === 2)
      .map((p) => {
        if (p.trafficType === 1) return p.lane?.[0]?.name || "지하철";
        if (p.trafficType === 2) return `${p.lane?.[0]?.busNo}번`;
        return null;
      })
      .filter(Boolean);

    if (transitNames.length === 0) return null;
    if (transitNames.length > 2) {
      return `${transitNames[0]} → ${transitNames[1]} 외`;
    }
    return transitNames.join(" → ");
  };

  // 공평함 계산 로직: 편차(Max-Min)가 적고, 평균이 짧을수록 유리
  const getFairestEndId = () => {
    if (starts.length < 2 || ends.length < 2 || matrixData.length === 0) return null;

    const scores = ends.map(end => {
      const colResults = matrixData.filter(d => d.toId === end.id && !d.error && d.timeMn >= 0);
      if (colResults.length !== starts.length) return { id: end.id, score: Infinity }; // 한 명이라도 못 가면 제외
      
      const times = colResults.map(d => d.timeMn);
      const max = Math.max(...times);
      const min = Math.min(...times);
      const diff = max - min;
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      
      // 새로운 가중치 로직: 
      // 이전에는 단순히 둘의 '차이(diff)'에 집착해서 모두가 손해보는(더 오래걸리는) 성수점(34, 51 -> 차이 17)이 
      // 논현점(13, 44 -> 차이 31)보다 점수가 높게 나왔습니다. (하향 평준화 오류)
      //
      // 개선된 로직: "모두 모이는데 걸리는 최장 시간(Max)" + "모두의 평균 이동 시간(Avg)"
      // 이 공식을 쓰면 논현(Max:44, Avg:28.5 = 72.5)이 성수(Max:51, Avg:42.5 = 93.5)를 완벽히 이기고 추천됩니다!
      return { id: end.id, score: max + avg };
    });

    const validScores = scores.filter(s => s.score !== Infinity);
    if (validScores.length === 0) return null;
    
    // 가장 낮은 점수가 최고로 공평한 목적지
    const minScore = Math.min(...validScores.map(s => s.score));
    const fairest = validScores.find(s => s.score === minScore);
    return fairest?.id;
  };

  const fairestEndId = getFairestEndId();

  return (
    <>
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
              <th className="p-4 font-semibold w-32 border-r border-border shrink-0 min-w-[120px]">
                <span className="text-xs text-foreground/50 block mb-1">도착지 ➡️</span>
                <span className="text-xs text-foreground/50 block">⬇️ 출발지</span>
              </th>
              {ends.map((end) => (
                <th key={end.id} className="p-2 min-w-[140px] font-semibold border-r border-border last:border-0 align-bottom">
                  <div className="flex flex-col items-center justify-end h-full min-h-[48px] pb-2">
                    {fairestEndId === end.id ? (
                      <span className="mb-1.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                        👑 황금 밸런스
                      </span>
                    ) : (
                      // 높이 유지를 위한 빈 공간
                      <div className="h-5 mb-1.5"></div>
                    )}
                    <span className="truncate w-full max-w-[120px]">{end.place_name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starts.map((start) => {
              // 현재 행(이 출발지)에서 최단 시간 찾기
              const rowResults = matrixData.filter(d => d.fromId === start.id && !d.error && d.timeMn >= 0);
              const minTimeForStart = rowResults.length > 0 ? Math.min(...rowResults.map(d => d.timeMn)) : -1;

              return (
                <tr key={start.id} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors group">
                  <th className="p-4 font-medium text-foreground bg-surface border-r border-border text-left truncate max-w-[120px]">
                    {start.place_name}
                  </th>
                  {ends.map((end) => {
                    const res = getResult(start.id, end.id);
                    const isMinTime = res && res.timeMn === minTimeForStart && res.timeMn >= 0;
                    const summary = res ? getShortSummary(res.subPath) : null;

                    return (
                      <td key={`${start.id}-${end.id}`} className="p-0 border-r border-border last:border-0">
                        {res ? (
                          res.timeMn >= 0 ? (
                            <button
                              onClick={() => setSelectedResult({ res, startName: start.place_name, endName: end.place_name })}
                              className="w-full h-full p-4 flex flex-col gap-1.5 items-center justify-center hover:bg-primary/10 transition-colors focus:outline-none relative min-h-[90px]"
                            >
                              {isMinTime && (
                                <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  최단
                                </span>
                              )}
                              <div className="flex items-baseline gap-1">
                                <span className={`text-lg font-bold ${isMinTime ? "text-primary" : "text-foreground"}`}>
                                  {res.timeMn === 0 ? "도보" : formatTime(res.timeMn)}
                                </span>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                {summary && (
                                  <span className="text-[11px] font-medium text-foreground/70 bg-primary/10 px-1.5 py-0.5 rounded max-w-[110px] truncate">
                                    {summary}
                                  </span>
                                )}
                                {res.payment > 0 && (
                                  <span className="text-[10px] text-foreground/50 mt-0.5">
                                    {res.payment.toLocaleString()}원
                                  </span>
                                )}
                              </div>
                            </button>
                          ) : (
                            <div className="p-4 flex items-center justify-center h-full">
                              <span
                                className="text-red-500 text-xs break-words max-w-[100px]"
                                title={getErrorTitle(res)}
                              >
                                {res.errorMessage || "조회 실패"}
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="p-4 flex items-center justify-center h-full">
                            <span className="text-foreground/30">-</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RouteDetailModal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        result={selectedResult?.res || null}
        startName={selectedResult?.startName || ""}
        endName={selectedResult?.endName || ""}
      />
    </>
  );
}
