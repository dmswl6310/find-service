"use client";

import { TransitFetchResult } from "@/types/odsay";
import { formatTime } from "@/utils/formatTime";
import { useEffect } from "react";

interface RouteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TransitFetchResult | null;
  startName: string;
  endName: string;
}

export default function RouteDetailModal({
  isOpen,
  onClose,
  result,
  startName,
  endName,
}: RouteDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-end">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal/Drawer Content */}
      <div
        className="relative z-10 w-full sm:w-[400px] h-[80vh] sm:h-[600px] bg-surface rounded-t-2xl sm:rounded-2xl sm:mb-8 shadow-xl flex flex-col transform transition-transform overflow-hidden animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-20">
          <div>
            <h3 className="text-lg font-bold text-foreground truncate max-w-[280px]">
              {startName} ➡️ {endName}
            </h3>
            <p className="text-sm text-foreground/60 mt-1">
              상세 이동 경로
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Summary Area */}
        <div className="p-5 bg-primary/5 flex justify-between items-center border-b border-border">
          <div className="flex flex-col">
            <span className="text-xs text-foreground/60 mb-1">소요 시간 / 환승</span>
            <span className="text-2xl font-bold text-primary">
              {result.timeMn === 0 ? "도보" : formatTime(result.timeMn)}
              <span className="text-sm ml-2 font-medium text-foreground/80">
                {result.transitCount ? `환승 ${result.transitCount}회` : ""}
              </span>
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-foreground/60 mb-1">총 요금</span>
            <span className="text-lg font-semibold text-foreground">
              {result.payment ? `${result.payment.toLocaleString()}원` : "무료"}
            </span>
          </div>
        </div>

        {/* Detail List */}
        <div className="flex-1 overflow-y-auto p-5 pb-10">
          {!result.subPath || result.subPath.length === 0 ? (
            <div className="text-center text-foreground/50 mt-10">
              상세 경로 정보가 없습니다. (도보 이동)
            </div>
          ) : (
            <div className="relative pl-4 space-y-6">
              {/* Vertical Line */}
              <div className="absolute left-6 top-2 bottom-4 w-0.5 bg-border z-0"></div>

              {result.subPath.map((path, idx) => {
                const isWalk = path.trafficType === 3;
                const isSubway = path.trafficType === 1;
                const isBus = path.trafficType === 2;

                let iconType = "🏃";
                let badgeColor = "bg-gray-200 text-gray-700";
                if (isSubway) {
                  iconType = "🚇";
                  badgeColor = "bg-blue-100 text-blue-700";
                } else if (isBus) {
                  iconType = "🚌";
                  badgeColor = "bg-green-100 text-green-700";
                }

                let lineName = "도보";
                if (path.lane && path.lane.length > 0) {
                  if (isSubway) lineName = path.lane[0].name || "지하철";
                  if (isBus) lineName = `${path.lane[0].busNo}번 버스`;
                }

                return (
                  <div key={idx} className="relative z-10 flex gap-4">
                    <div className="w-5 h-5 mt-1 rounded-full bg-surface border-2 border-primary flex items-center justify-center shrink-0 shadow-sm text-[10px]">
                      {iconType}
                    </div>
                    <div className="flex-1 pb-4">
                      {isWalk ? (
                        <div className="text-sm text-foreground/70 font-medium pt-1">
                          도보 이동 {path.sectionTime}분
                          {path.distance ? ` (${path.distance}m)` : ""}
                        </div>
                      ) : (
                        <div className="bg-surface border border-border rounded-xl p-3 shadow-sm">
                          <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${badgeColor}`}>
                            {lineName}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
                                {path.startName} 승차
                              </div>
                              <div className="text-xs text-foreground/50 border-l border-dashed border-border ml-0.5 pl-3 py-1">
                                {path.stationCount}개 정류장 이동 ({path.sectionTime}분)
                              </div>
                              <div className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30"></span>
                                {path.endName} 하차
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
