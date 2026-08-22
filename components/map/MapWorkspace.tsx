"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import MapFailureState from "@/components/map/MapFailureState";
import type { MiniMapProps } from "@/components/map/MiniMap";
import type { CandidateSummary } from "@/components/result/resultModel";

const MAP_CHUNK_LOAD_TIMEOUT_MS = 8000;

function MapLoadingState() {
  return (
    <div
      className="flex h-full min-h-80 w-full items-center justify-center rounded-xl border border-border bg-surface"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-action border-t-transparent" />
      <span className="sr-only">지도를 준비하는 중입니다.</span>
    </div>
  );
}

const LiveMiniMap = dynamic(() => import("@/components/map/MiniMap"), {
  ssr: false,
  loading: MapLoadingState,
});

type MapLoadErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

class MapLoadErrorBoundary extends Component<MapLoadErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? <MapFailureState /> : this.props.children;
  }
}

export type MapWorkspaceProps = Omit<MiniMapProps, "onMount"> & {
  selectedCandidate?: CandidateSummary;
  selectedRouteName?: string;
  fill?: boolean;
};

export default function MapWorkspace({ selectedCandidate, selectedRouteName, fill = false, ...mapProps }: MapWorkspaceProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const miniMapMountedRef = useRef(false);
  const loadFailedRef = useRef(false);

  const clearLoadTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleLoadFailure = useCallback(() => {
    loadFailedRef.current = true;
    clearLoadTimeout();
    setLoadFailed(true);
  }, [clearLoadTimeout]);

  const handleMiniMapMount = useCallback(() => {
    miniMapMountedRef.current = true;
    clearLoadTimeout();
  }, [clearLoadTimeout]);

  useEffect(() => {
    if (miniMapMountedRef.current || loadFailedRef.current) return;

    timeoutRef.current = window.setTimeout(handleLoadFailure, MAP_CHUNK_LOAD_TIMEOUT_MS);

    return clearLoadTimeout;
  }, [clearLoadTimeout, handleLoadFailure]);

  return (
    <section className={fill ? "flex h-full min-h-0 flex-col gap-3" : "space-y-3"} aria-label="지도 작업공간">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-origin-soft px-2.5 py-1 text-origin">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-origin text-[10px] font-bold text-action-foreground">1</span>
          숫자 원형 · 출발지
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-candidate-soft px-2.5 py-1 text-candidate">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-candidate text-[10px] font-bold text-action-foreground">A</span>
          문자 사각 핀 · 후보지
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-origin-soft px-2.5 py-1 text-origin">
          <span className="h-1 w-5 rounded-full bg-origin" />
          선택 경로
        </span>
      </div>

      <div className={fill ? "relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border shadow-sm" : "relative h-[400px] overflow-hidden rounded-xl border border-border shadow-sm lg:h-[calc(100vh-4rem)]"}>
        {loadFailed ? (
          <MapFailureState />
        ) : (
          <MapLoadErrorBoundary onError={handleLoadFailure}>
            <LiveMiniMap {...mapProps} onMount={handleMiniMapMount} />
          </MapLoadErrorBoundary>
        )}
        {selectedCandidate ? (
          <aside
            aria-label="선택 후보 요약"
            className="absolute inset-x-3 bottom-3 rounded-xl border border-border-strong bg-surface/95 p-4 shadow-lg backdrop-blur-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-candidate">선택 후보</p>
                <p className="mt-1 font-semibold text-text">{selectedCandidate.name}</p>
                {selectedRouteName ? <p className="mt-1 text-xs text-text-muted">{selectedRouteName}</p> : null}
              </div>
              {selectedCandidate.isComplete ? (
                <p className="text-sm font-medium text-text">
                  평균 {selectedCandidate.averageMinutes}분 · 최장 {selectedCandidate.maxMinutes}분
                </p>
              ) : (
                <p className="text-sm font-medium text-warning">
                  비교 불가 · {selectedCandidate.validRoutes}/{selectedCandidate.totalRoutes} 경로 완료
                </p>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
