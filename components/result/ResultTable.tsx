"use client";

import { KakaoLocation } from "@/types/kakao";
import { TransitFetchResult, OdsaySubPath } from "@/types/odsay";
import { formatTime } from "@/utils/formatTime";
import { getFairestEndId } from "@/utils/fairness";
import { useState } from "react";
import RouteDetailModal from "./RouteDetailModal";

interface ResultTableProps {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  matrixData: TransitFetchResult[];
  isCalculating: boolean;
  onSelectRoute?: (res: TransitFetchResult) => void;
  activeMapRouteId?: string; // fromId-toId 조합
}

export default function ResultTable({ starts, ends, matrixData, isCalculating, onSelectRoute, activeMapRouteId }: ResultTableProps) {
  const [selectedResult, setSelectedResult] = useState<{ res: TransitFetchResult, startName: string, endName: string } | null>(null);
  const [openTooltipEndId, setOpenTooltipEndId] = useState<string | null>(null);
  const [openErrorId, setOpenErrorId] = useState<string | null>(null);

  const openRouteDetail = (res: TransitFetchResult, startName: string, endName: string) => {
    setSelectedResult({ res, startName, endName });
  };

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

  const fairestEndId = getFairestEndId(starts, ends, matrixData);

  const getStartName = (startId: string) => starts.find((start) => start.id === startId)?.place_name || "출발지";
  const getEndName = (endId: string) => ends.find((end) => end.id === endId)?.place_name || "목적지";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {ends.map((end) => {
          const isFairest = fairestEndId === end.id;
          const endResults = starts.map((start) => ({
            start,
            result: getResult(start.id, end.id),
          }));
          const validResults = endResults
            .map((item) => item.result)
            .filter((result): result is TransitFetchResult => Boolean(result && !result.error && result.timeMn >= 0));
          const bestTime = validResults.length > 0 ? Math.min(...validResults.map((result) => result.timeMn)) : null;

          return (
            <article key={end.id} className={`rounded-2xl border bg-surface p-4 shadow-sm ${isFairest ? "border-amber-300 ring-2 ring-amber-200/70" : "border-border"}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/45">목적지 후보</p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">{end.place_name}</h3>
                </div>
                {isFairest && (
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-sm">
                    👑 황금 밸런스
                  </span>
                )}
              </div>

              {isFairest && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  최대 소요시간과 평균 소요시간을 함께 봤을 때 가장 균형 잡힌 후보입니다.
                </p>
              )}

              <div className="space-y-2">
                {endResults.map(({ start, result }) => {
                  const routeId = result ? `${result.fromId}-${result.toId}` : `${start.id}-${end.id}`;
                  const isMapActive = result && activeMapRouteId === `${result.fromId}-${result.toId}`;
                  const isBest = result && bestTime !== null && result.timeMn === bestTime && result.timeMn >= 0;
                  const summary = result ? getShortSummary(result.subPath) : null;
                  const errorTitle = result?.error ? getErrorTitle(result) : null;

                  return (
                    <div key={routeId} className={`rounded-xl border px-3 py-3 ${isMapActive ? "border-primary bg-primary/10" : "border-border bg-background/70"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{start.place_name}</p>
                          {summary && <p className="mt-1 truncate text-xs text-foreground/60">{summary}</p>}
                        </div>
                        {result ? (
                          result.timeMn >= 0 ? (
                            <div className="shrink-0 text-right">
                              {isBest && <span className="mb-1 inline-block rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">최단</span>}
                              <p className="text-base font-bold text-primary">{result.timeMn === 0 ? "도보" : `${result.timeMn} 분`}</p>
                              {result.payment > 0 && <p className="text-[11px] text-foreground/50">{result.payment.toLocaleString()}원</p>}
                            </div>
                          ) : (
                            <div className="shrink-0 text-right">
                              <p className="text-xs font-semibold text-red-500">조회 실패</p>
                            </div>
                          )
                        ) : (
                          <span className="text-sm text-foreground/30">대기</span>
                        )}
                      </div>

                      {result && result.timeMn >= 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectRoute?.(result)}
                            className="rounded-lg border border-primary/20 bg-primary/10 px-2 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                          >
                            지도에서 보기
                          </button>
                          <button
                            type="button"
                            onClick={() => openRouteDetail(result, start.place_name, end.place_name)}
                            className="rounded-lg border border-border bg-surface px-2 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            상세 경로
                          </button>
                        </div>
                      )}

                      {result && result.timeMn < 0 && (
                        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                          <button
                            type="button"
                            onClick={() => setOpenErrorId((current) => current === routeId ? null : routeId)}
                            className="font-semibold underline decoration-red-300 underline-offset-2"
                            aria-expanded={openErrorId === routeId}
                          >
                            실패 사유 {openErrorId === routeId ? "접기" : "보기"}
                          </button>
                          <p className="mt-1">모바일에서는 버튼을 눌러 상세 사유를 확인할 수 있습니다.</p>
                          {openErrorId === routeId && errorTitle && <p className="mt-1 text-red-600/80">{errorTitle}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <div className="relative hidden w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm md:block">
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
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="bg-gradient-to-r from-amber-100 to-yellow-300 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ring-1 ring-amber-300/70">
                          👑 황금 밸런스
                        </span>
                        <div className="group/tooltip relative">
                          <button
                            type="button"
                            aria-label="황금 밸런스 설명 보기"
                            aria-expanded={openTooltipEndId === end.id}
                            aria-describedby={`golden-balance-${end.id}`}
                            onClick={() => setOpenTooltipEndId((current) => current === end.id ? null : end.id)}
                            className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-300/80 bg-white/90 text-[10px] font-bold leading-none text-amber-700 shadow-sm transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                          >
                            i
                          </button>
                          <div id={`golden-balance-${end.id}`} className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-52 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-left text-[11px] font-medium leading-relaxed text-popover-foreground shadow-lg transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100 ${openTooltipEndId === end.id ? "opacity-100" : "opacity-0"}`}>
                            최단은 각 출발지별 가장 빠른 경로, 황금 밸런스는 최대 소요시간과 평균 소요시간을 함께 본 가장 균형 잡힌 도착지예요.
                          </div>
                        </div>
                      </div>
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
                    const isMapActive = res && activeMapRouteId === `${res.fromId}-${res.toId}`;

                    return (
                      <td key={`${start.id}-${end.id}`} className="p-0 border-r border-border last:border-0">
                        {res ? (
                          res.timeMn >= 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectRoute) onSelectRoute(res);
                              }}
                              className={`w-full h-full p-4 flex flex-col gap-1.5 items-center justify-center transition-colors focus:outline-none relative min-h-[90px] ${isMapActive ? "bg-primary/20 hover:bg-primary/30 ring-2 ring-primary ring-inset" : "hover:bg-primary/10"}`}
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

                              <span className="mt-1 text-[10px] font-medium text-foreground/50">
                                클릭하면 지도에서 경로가 바뀝니다
                              </span>
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

                        {res && res.timeMn >= 0 && (
                          <div className="border-t border-border/70 bg-background/70 px-2 py-2">
                            <button
                              type="button"
                              onClick={() => openRouteDetail(res, start.place_name, end.place_name)}
                              className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              상세 경로 보기
                            </button>
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

      {matrixData.length > 0 && (
        <p className="text-xs leading-5 text-foreground/55">
          최단은 각 출발지 행에서 가장 빠른 경로이고, 황금 밸런스는 여러 출발지 전체의 균형을 고려한 도착지입니다.
        </p>
      )}

      <RouteDetailModal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        result={selectedResult?.res || null}
        startName={selectedResult?.startName || (selectedResult?.res ? getStartName(selectedResult.res.fromId) : "")}
        endName={selectedResult?.endName || (selectedResult?.res ? getEndName(selectedResult.res.toId) : "")}
      />
    </>
  );
}
