"use client";

import { useMemo, useState } from "react";
import LocationPanel from "@/app/home/LocationPanel";
import ResultPanel from "@/app/home/ResultPanel";
import { useSelectedRouteMapState } from "@/app/home/useSelectedRouteMapState";
import MapWorkspace from "@/components/map/MapWorkspace";
import CalculationProgress from "@/components/result/CalculationProgress";
import RouteDetailSheet from "@/components/result/RouteDetailSheet";
import RouteMatrix from "@/components/result/RouteMatrix";
import { buildCandidateSummaries } from "@/components/result/resultModel";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import type { CalculationProgress as CalculationProgressState } from "@/hooks/useTransitMatrix";
import { useAppStore } from "@/store/useAppStore";
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

export type ComparisonWorkspaceProps = {
  matrixData: TransitFetchResult[];
  isCalculating: boolean;
  calculateMatrix: (
    starts: KakaoLocation[],
    ends: KakaoLocation[],
    targetDate?: string,
    targetTime?: string,
  ) => Promise<void>;
  error: string | null;
  resetMatrix: () => void;
  calculationProgress: CalculationProgressState;
};

type RouteDetailState = {
  result: TransitFetchResult;
  startName: string;
  endName: string;
};

export default function ComparisonWorkspace({
  matrixData,
  isCalculating,
  calculateMatrix,
  error,
  resetMatrix,
  calculationProgress,
}: ComparisonWorkspaceProps) {
  const {
    starts,
    ends,
    addStart,
    removeStart,
    addEnd,
    removeEnd,
    useDepartureTime,
    targetDate,
    targetTime,
  } = useAppStore();
  const [selectedStartId, setSelectedStartId] = useState<string>();
  const [selectedEndId, setSelectedEndId] = useState<string>();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [routeDetail, setRouteDetail] = useState<RouteDetailState | null>(null);
  const [previousIsCalculating, setPreviousIsCalculating] = useState(isCalculating);
  const {
    activeMapRouteId,
    selectedRoute,
    geometryRoute,
    routeSegments,
    detailedPath,
    handleSelectRoute,
  } = useSelectedRouteMapState({ starts, ends, matrixData, isCalculating });

  if (isCalculating !== previousIsCalculating) {
    setPreviousIsCalculating(isCalculating);
    if (isCalculating) {
      setIsMatrixOpen(false);
      setRouteDetail(null);
      setIsEditing(false);
    }
  }

  const summaries = useMemo(
    () => buildCandidateSummaries(starts, ends, matrixData),
    [starts, ends, matrixData],
  );
  const hasLocations = starts.length > 0 || ends.length > 0;
  const hasResults = matrixData.length > 0 && !isCalculating;
  const panelMode = isCalculating
    ? "loading"
    : isEditing
      ? "input"
      : hasResults
        ? "result"
        : hasLocations
          ? "input"
          : "empty";
  const currentSelectedRoute =
    hasResults &&
    selectedRoute &&
    matrixData.includes(selectedRoute) &&
    !selectedRoute.error &&
    selectedRoute.timeMn >= 0
      ? selectedRoute
      : undefined;
  const visibleSelectedRoute =
    currentSelectedRoute &&
    (!selectedCandidateId || currentSelectedRoute.toId === selectedCandidateId)
      ? currentSelectedRoute
      : undefined;
  const ownsVisibleRouteGeometry =
    visibleSelectedRoute !== undefined && geometryRoute === visibleSelectedRoute;
  const selectedCandidate = hasResults
    ? summaries.find((summary) => summary.id === selectedCandidateId) ??
      summaries.find((summary) => summary.id === visibleSelectedRoute?.toId) ??
      summaries.find((summary) => summary.isFairest) ??
      summaries[0]
    : undefined;
  const selectedStartName = starts.find(
    (start) => start.id === visibleSelectedRoute?.fromId,
  )?.place_name;
  const selectedEndName = ends.find(
    (end) => end.id === visibleSelectedRoute?.toId,
  )?.place_name;
  const selectedRouteName =
    selectedStartName && selectedEndName
      ? `${selectedStartName}에서 ${selectedEndName}까지`
      : undefined;

  const closeSecondaryViews = () => {
    setIsMatrixOpen(false);
    setRouteDetail(null);
  };

  const handleCalculate = () => {
    closeSecondaryViews();
    setIsEditing(false);
    setSelectedStartId(undefined);
    setSelectedEndId(undefined);
    setSelectedCandidateId(undefined);
    void calculateMatrix(
      starts,
      ends,
      useDepartureTime ? targetDate : undefined,
      useDepartureTime ? targetTime : undefined,
    );
  };

  const handleAddStart = (location: KakaoLocation) => {
    resetMatrix();
    closeSecondaryViews();
    setSelectedCandidateId(undefined);
    addStart(location);
  };

  const handleRemoveStart = (id: string) => {
    resetMatrix();
    closeSecondaryViews();
    setSelectedCandidateId(undefined);
    setSelectedStartId((current) => (current === id ? undefined : current));
    removeStart(id);
  };

  const handleAddEnd = (location: KakaoLocation) => {
    resetMatrix();
    closeSecondaryViews();
    setSelectedCandidateId(undefined);
    addEnd(location);
  };

  const handleRemoveEnd = (id: string) => {
    resetMatrix();
    closeSecondaryViews();
    setSelectedCandidateId(undefined);
    setSelectedEndId((current) => (current === id ? undefined : current));
    removeEnd(id);
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setSelectedEndId(candidateId);
    const preferredRoute =
      matrixData.find(
        (result) =>
          result.toId === candidateId &&
          result.fromId === selectedStartId &&
          !result.error &&
          result.timeMn >= 0,
      ) ??
      matrixData.find(
        (result) => result.toId === candidateId && !result.error && result.timeMn >= 0,
      );

    if (preferredRoute) {
      setSelectedStartId(preferredRoute.fromId);
      handleSelectRoute(preferredRoute);
    } else {
      setSelectedStartId(undefined);
    }
  };

  const handleSelectMatrixRoute = (result: TransitFetchResult) => {
    setSelectedStartId(result.fromId);
    setSelectedEndId(result.toId);
    setSelectedCandidateId(result.toId);
    handleSelectRoute(result);
  };

  const handleOpenRoute = (
    result: TransitFetchResult,
    startName: string,
    endName: string,
  ) => {
    setRouteDetail({ result, startName, endName });
  };

  const handleEditInputs = () => {
    closeSecondaryViews();
    setIsEditing(true);
  };

  const activePanel = panelMode === "loading" ? (
    <CalculationProgress
      completed={calculationProgress.completed}
      total={calculationProgress.total}
    />
  ) : isMatrixOpen ? (
    <section aria-label="경로표" className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-muted">상세 비교</p>
          <h2 className="mt-1 text-xl font-semibold text-text">출발지별 경로표</h2>
        </div>
        <Button type="button" variant="ghost" onClick={() => setIsMatrixOpen(false)}>
          비교 결과로 돌아가기
        </Button>
      </div>
      <RouteMatrix
        starts={starts}
        ends={ends}
        matrixData={matrixData}
        activeMapRouteId={visibleSelectedRoute ? activeMapRouteId ?? undefined : undefined}
        onSelectRoute={handleSelectMatrixRoute}
        onOpenRoute={handleOpenRoute}
      />
    </section>
  ) : panelMode === "result" ? (
    <ResultPanel
      summaries={summaries}
      matrixData={matrixData}
      calculationProgress={calculationProgress}
      isCalculating={isCalculating}
      error={error}
      onEditInputs={handleEditInputs}
      onRetry={handleCalculate}
      onSelectCandidate={handleSelectCandidate}
      onOpenMatrix={() => setIsMatrixOpen(true)}
    />
  ) : (
    <LocationPanel
      starts={starts}
      ends={ends}
      selectedStartId={selectedStartId}
      selectedEndId={selectedEndId}
      isCalculating={isCalculating}
      onAddStart={handleAddStart}
      onAddEnd={handleAddEnd}
      onRemoveStart={handleRemoveStart}
      onRemoveEnd={handleRemoveEnd}
      onSelectStart={setSelectedStartId}
      onSelectEnd={setSelectedEndId}
      onCalculate={handleCalculate}
    />
  );

  return (
    <section
      aria-label="장소 비교 작업공간"
      className="relative grid h-[calc(100svh-4rem)] min-h-[640px] min-w-0 overflow-hidden bg-canvas md:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]"
    >
      <aside className="absolute inset-x-0 bottom-0 z-20 min-w-0 md:static md:col-start-1 md:row-start-1 md:h-full">
        <BottomSheet
          title="비교 패널"
          className="max-h-[72svh] overflow-y-auto md:h-full md:max-h-none md:rounded-none md:border-x-0 md:border-b-0 md:shadow-none"
        >
          <div className="min-w-0 p-4 sm:p-5">
            <header className="mb-5 border-b border-border pb-5">
              <p className="text-xs font-semibold text-action">대중교통 약속 장소 비교</p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight text-text">
                어디서 만나는 게 가장 균형 잡힐까요?
              </h1>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                출발지와 후보지를 추가하면 이동시간의 균형을 비교합니다.
              </p>
            </header>
            {activePanel}
          </div>
        </BottomSheet>
      </aside>

      <section
        aria-label="출발지와 후보지 지도"
        className="col-start-1 row-start-1 h-full min-h-0 min-w-0 p-3 pb-0 md:col-start-2 md:p-4"
      >
        <MapWorkspace
          fill
          starts={starts}
          ends={ends}
          routeSegments={ownsVisibleRouteGeometry ? routeSegments : []}
          detailedPath={ownsVisibleRouteGeometry ? detailedPath : []}
          selectedStartId={visibleSelectedRoute?.fromId ?? selectedStartId}
          selectedEndId={visibleSelectedRoute?.toId ?? selectedEndId}
          selectedCandidate={selectedCandidate}
          selectedRouteName={selectedRouteName}
        />
      </section>

      <RouteDetailSheet
        isOpen={!isCalculating && routeDetail !== null}
        onClose={() => setRouteDetail(null)}
        result={routeDetail?.result ?? null}
        startName={routeDetail?.startName ?? ""}
        endName={routeDetail?.endName ?? ""}
      />
    </section>
  );
}
