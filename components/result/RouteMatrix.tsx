"use client";

import { findRouteResult } from "@/components/result/resultModel";
import Button from "@/components/ui/Button";
import type { KakaoLocation } from "@/types/kakao";
import type { OdsaySubPath, TransitFetchResult } from "@/types/odsay";
import { formatTime } from "@/utils/formatTime";

export type RouteMatrixProps = {
  starts: KakaoLocation[];
  ends: KakaoLocation[];
  matrixData: TransitFetchResult[];
  activeMapRouteId?: string;
  onSelectRoute: (result: TransitFetchResult) => void;
  onOpenRoute: (result: TransitFetchResult, startName: string, endName: string) => void;
};

function getTransitSummary(subPaths: OdsaySubPath[] | undefined, pathType: number) {
  const names = (subPaths ?? [])
    .filter((path) => path.trafficType === 1 || path.trafficType === 2)
    .map((path) => {
      if (path.trafficType === 1) return path.lane?.[0]?.name || "지하철";
      const busNumber = path.lane?.[0]?.busNo;
      return busNumber ? `${busNumber}번 버스` : "버스";
    });

  if (names.length > 2) return `${names[0]} → ${names[1]} 외`;
  if (names.length > 0) return names.join(" → ");
  if (subPaths?.some((path) => path.trafficType === 3)) return "도보";
  if (pathType === 1) return "지하철";
  if (pathType === 2) return "버스";
  if (pathType === 3) return "버스 + 지하철";
  return "세부 경로 정보 없음";
}

function isSuccessfulRoute(result: TransitFetchResult) {
  return !result.error && result.timeMn >= 0;
}

export default function RouteMatrix({
  starts,
  ends,
  matrixData,
  activeMapRouteId,
  onSelectRoute,
  onOpenRoute,
}: RouteMatrixProps) {
  if (starts.length === 0 || ends.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface-raised p-5 text-sm text-text-muted">
        출발지와 후보지를 추가하면 경로표가 나타납니다.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <caption className="sr-only">출발지별 후보지 경로 비교</caption>
        <thead>
          <tr className="border-b border-border bg-surface-raised">
            <th scope="col" className="min-w-32 border-r border-border p-4 font-semibold text-text">
              출발지
            </th>
            {ends.map((end) => (
              <th key={end.id} scope="col" className="min-w-48 border-r border-border p-4 text-center font-semibold text-text last:border-r-0">
                {end.place_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {starts.map((start) => (
            <tr key={start.id} className="border-b border-border last:border-b-0">
              <th scope="row" className="border-r border-border bg-surface-raised p-4 font-medium text-text">
                {start.place_name}
              </th>
              {ends.map((end) => {
                const result = findRouteResult(matrixData, start.id, end.id);
                const routeId = `${start.id}-${end.id}`;

                if (!result) {
                  return (
                    <td key={routeId} className="border-r border-border p-4 text-center last:border-r-0">
                      <p role="status" className="font-medium text-danger">경로 정보 없음</p>
                      <p className="mt-1 text-xs text-text-muted">이 경로의 계산 결과가 누락되었습니다.</p>
                    </td>
                  );
                }

                if (!isSuccessfulRoute(result)) {
                  return (
                    <td key={routeId} className="border-r border-border p-4 text-center last:border-r-0">
                      <p className="font-semibold text-danger">{result.errorMessage || "경로 조회 실패"}</p>
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-3 w-full"
                        aria-label={`${start.place_name}에서 ${end.place_name}까지 실패 상세 보기`}
                        onClick={() => onOpenRoute(result, start.place_name, end.place_name)}
                      >
                        실패 상세 보기
                      </Button>
                    </td>
                  );
                }

                const isActive = activeMapRouteId === routeId;
                const timeLabel = formatTime(result.timeMn);

                return (
                  <td
                    key={routeId}
                    className={`border-r border-border p-3 text-center last:border-r-0 ${isActive ? "bg-origin-soft" : "bg-surface"}`}
                  >
                    <button
                      type="button"
                      aria-label={`${start.place_name}에서 ${end.place_name}까지 ${timeLabel}, 지도에서 보기`}
                      aria-pressed={isActive}
                      onClick={() => onSelectRoute(result)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 ${
                        isActive ? "border-action bg-surface" : "border-border bg-surface-raised hover:border-border-strong"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-lg font-semibold text-text">{timeLabel}</span>
                        {isActive ? <span className="text-xs font-semibold text-action">선택됨</span> : null}
                      </span>
                      <span className="mt-2 block text-xs text-text-muted">
                        {getTransitSummary(result.subPath, result.pathType)}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-text">
                        {result.payment > 0 ? `${result.payment.toLocaleString()}원` : "무료"}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-2 w-full"
                      aria-label={`${start.place_name}에서 ${end.place_name}까지 상세 경로 보기`}
                      onClick={() => onOpenRoute(result, start.place_name, end.place_name)}
                    >
                      상세 경로 보기
                    </Button>
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
